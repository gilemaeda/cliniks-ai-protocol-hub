import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Save, Upload, Download, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AISettings {
  protocol_chat_prompt_text?: string;
  ai_model?: string;
  id?: number; // Assuming 'id' is a number, adjust if necessary
  prompt_text?: string; // Added based on usage in saveChatPromptSettings
}

const AdminChatProtocolPrompt = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [globalAiModel, setGlobalAiModel] = useState('');

  const fetchChatPromptSettings = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Regenerate Supabase types to avoid 'as any'
      const { data, error } = await supabase
        .from('ai_settings')
        .select('protocol_chat_prompt_text, ai_model')
        .limit(1)
        .single<AISettings>();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPromptText(data.protocol_chat_prompt_text || '');
        setGlobalAiModel(data.ai_model || 'gpt-4o-mini');
      } else {
         // Fallback if no settings row exists, try to get at least the global model
         const { data: modelData } = await supabase
          .from('ai_settings')
          .select('ai_model')
          .limit(1)
          .single<AISettings>();
        setGlobalAiModel(modelData?.ai_model || 'gpt-4o-mini');
      }
    } catch (error) {
      console.error('Erro ao buscar configurações do prompt do chat:', error);
      toast({
        title: "Erro ao carregar prompt",
        description: "Não foi possível carregar o prompt do chat de protocolo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Added toast to dependencies as it's used inside

  useEffect(() => {
    fetchChatPromptSettings();
  }, [fetchChatPromptSettings]);

  const saveChatPromptSettings = async () => {
    try {
      setSaveLoading(true);
      const { data: existingData, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .single<{ id: number }>();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let result;
      if (existingData) {
        result = await supabase
          .from('ai_settings')
          .update({
            protocol_chat_prompt_text: promptText,
            updated_at: new Date().toISOString()
          })
          .eq('id', String(existingData.id));
      } else {
        result = await supabase
          .from('ai_settings')
          .insert({
            protocol_chat_prompt_text: promptText,
            prompt_text: '', 
            ai_model: globalAiModel || 'gpt-4o-mini',
          });
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Prompt do Chat Salvo!",
        description: "O prompt para o chat de protocolo foi atualizado com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar prompt do chat:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o prompt do chat de protocolo.",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPromptText(content);
        toast({
          title: "Arquivo carregado!",
          description: "O prompt foi carregado do arquivo."
        });
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo .txt",
        variant: "destructive"
      });
    }
  };

  const downloadPrompt = () => {
    const blob = new Blob([promptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt_chat_protocolo.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este prompt é usado especificamente pela funcionalidade de "Criação de Protocolo com IA" (chat).
          O modelo de IA (ex: GPT-4o Mini) e a API Key são configurados globalmente na aba "Prompt IA".
          O modelo atualmente configurado é: <strong>{globalAiModel || 'Não definido'}</strong>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Prompt para Chat de Protocolo</span>
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('chat-prompt-file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Carregar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPrompt}
                disabled={!promptText}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            id="chat-prompt-file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Textarea
            placeholder="Digite ou cole aqui o prompt que a IA utilizará para guiar a conversa na criação de protocolos..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="mt-2 text-xs text-gray-500">
            Caracteres: {promptText.length}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={fetchChatPromptSettings} disabled={loading || saveLoading}>
          Cancelar Alterações
        </Button>
        <Button onClick={saveChatPromptSettings} disabled={saveLoading || loading}>
          {saveLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
          <Save className="h-4 w-4 mr-2" />
          Salvar Prompt do Chat
        </Button>
      </div>
    </div>
  );
};

export default AdminChatProtocolPrompt;
