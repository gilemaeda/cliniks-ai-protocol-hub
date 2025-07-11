import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, History, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatProtocoloIA from '@/components/protocolos/ChatProtocoloIA';
import HistoricoProtocolos from '@/components/protocolos/HistoricoProtocolos';
// import ProtocoloEditor from '@/components/protocolos/ProtocoloEditor';
// import ProtocoloManual from '@/components/protocolos/ProtocoloManual';
// import { Protocol, useProtocolosQuery } from '@/hooks/useProtocolosQuery';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProtocolosPersonalizados = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat-ia');
  const [editingProtocol, setEditingProtocol] = useState<any | null>(null);
  // const { data: protocols, isLoading, error, refetch } = useProtocolosQuery(user?.id);

  const handleProtocolGenerated = async (protocolContent: string) => {
    if (!user?.id) {
      toast({ title: "Erro de Autenticação", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }

    try {
      const { data: clinicData, error: rpcError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (rpcError || !clinicData || clinicData.length === 0) {
        throw new Error(rpcError?.message || 'Dados da clínica não encontrados.');
      }
      
      const clinicId = clinicData[0].clinic_id;

      const newProtocol: Partial<Protocol> = {
        name: 'Protocolo via Chat',
        description: 'Protocolo gerado a partir da conversa com a IA.',
        content: protocolContent,
        clinic_id: clinicId,
      };
      setEditingProtocol(newProtocol);
      setActiveTab('editor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ title: "Erro ao buscar dados da clínica", description: errorMessage, variant: "destructive" });
    }
  };

  const handleProtocolCreated = (protocol: Partial<Protocol>) => {
    setEditingProtocol(protocol);
    setActiveTab('editor');
  };

  const handleBackToNew = () => {
    setEditingProtocol(null);
    setActiveTab('chat-ia');
  };

  const handleEditProtocol = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setActiveTab('editor');
  };

  const handleSaveProtocol = (savedProtocol: Protocol) => {
    setEditingProtocol(null);
    refetch(); // Atualiza a lista de protocolos
    setActiveTab('historico');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Protocolos Personalizados
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Crie protocolos únicos com inteligência artificial
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat-ia" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Protocolo Chat IA</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Manual</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center space-x-2" disabled={!editingProtocol}>
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat-ia">
            <ChatProtocoloIA onProtocolGenerated={handleProtocolGenerated} />
          </TabsContent>

          <TabsContent value="manual">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Manual em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Editor de protocolos em desenvolvimento
              </p>
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Histórico em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProtocolosPersonalizados;
