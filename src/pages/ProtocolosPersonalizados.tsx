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
  const [activeTab, setActiveTab] = useState('chat');
  const [editingProtocol, setEditingProtocol] = useState<any | null>(null);
  // const { data: protocols, isLoading, error, refetch } = useProtocolosQuery(user?.id);

  const handleProtocolGenerated = async (protocolContent: string) => {
    console.log('Protocolo gerado:', protocolContent);
  };

  const handleProtocolCreated = (protocol: any) => {
    console.log('Protocolo criado:', protocol);
  };

  const handleEditProtocol = (protocol: any) => {
    console.log('Editar protocolo:', protocol);
  };

  const handleSaveProtocol = (savedProtocol: any) => {
    console.log('Protocolo salvo:', savedProtocol);
  };

  const handleBackToNew = () => {
    setEditingProtocol(null);
    setActiveTab('chat');
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#424242]">Protocolos Personalizados</h1>
              <p className="text-[#424242]/70">Crie protocolos únicos com IA ou manualmente</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat IA</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Manual</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
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