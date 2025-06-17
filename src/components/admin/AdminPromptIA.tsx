
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Save, Upload, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminPromptIA = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settings, setSettings] = useState({
    prompt_text: '',
    ai_model: 'gpt-4o-mini',
    api_key: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          prompt_text: data.prompt_text || '',
          ai_model: data.ai_model || 'gpt-4o-mini',
          api_key: data.api_key || ''
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações da IA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaveLoading(true);

      // Verificar se já existe uma configuração
      const { data: existingData } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existingData) {
        // Atualizar configuração existente
        result = await supabase
          .from('ai_settings')
          .update({
            prompt_text: settings.prompt_text,
            ai_model: settings.ai_model,
            api_key: settings.api_key,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Criar nova configuração
        result = await supabase
          .from('ai_settings')
          .insert({
            prompt_text: settings.prompt_text,
            ai_model: settings.ai_model,
            api_key: settings.api_key
          });
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações da IA foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
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
        setSettings(prev => ({ ...prev, prompt_text: content }));
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
    const blob = new Blob([settings.prompt_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt_ia_cliniks.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado!",
      description: "O arquivo do prompt foi baixado."
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações do Prompt IA
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Configure o prompt e modelo de IA usado para gerar os protocolos
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Essas configurações afetam diretamente a qualidade e precisão dos protocolos gerados pela IA. 
          Tenha cuidado ao modificar o prompt base.
        </AlertDescription>
      </Alert>

      {/* Configurações do Modelo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Configurações do Modelo IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Modelo de IA
              </label>
              <Select value={settings.ai_model} onValueChange={(value) => setSettings(prev => ({ ...prev, ai_model: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recomendado)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                API Key (OpenAI)
              </label>
              <Input
                type="password"
                placeholder="sk-..."
                value={settings.api_key}
                onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Prompt Base da IA</span>
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Carregar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPrompt}
                disabled={!settings.prompt_text}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Textarea
            placeholder="Digite ou cole aqui o prompt que a IA utilizará para gerar os protocolos de tratamento..."
            value={settings.prompt_text}
            onChange={(e) => setSettings(prev => ({ ...prev, prompt_text: e.target.value }))}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="mt-2 text-xs text-gray-500">
            Caracteres: {settings.prompt_text.length}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={saveSettings} disabled={saveLoading}>
          {saveLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      {/* Preview do Prompt */}
      {settings.prompt_text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview do Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {settings.prompt_text.substring(0, 500)}
                {settings.prompt_text.length > 500 && '...'}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPromptIA;
