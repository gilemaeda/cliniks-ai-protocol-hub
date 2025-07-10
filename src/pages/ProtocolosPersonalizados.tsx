import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, History, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatProtocoloIA from '@/components/protocolos/ChatProtocoloIA';
import HistoricoProtocolos from '@/components/protocolos/HistoricoProtocolos';
import { Protocol, useProtocolosQuery } from '@/hooks/useProtocolosQuery';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProtocolosPersonalizados = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat-ia');
  const [editingProtocol, setEditingProtocol] = useState<Partial<Protocol> | null>(null);

  const { data: protocols = [], isLoading, error, refetch: refetchProtocols } = useProtocolosQuery(user?.id);

  const handleEditProtocol = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setActiveTab('editor');
  };

  const handleNewProtocol = () => {
    setEditingProtocol({});
    setActiveTab('editor');
  };

  const handleManualProtocol = () => {
    setActiveTab('manual');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleSaveProtocol = async (protocolData: any) => {
    // Simplified protocol saving - removed for now
    toast({ title: "Funcionalidade em desenvolvimento" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Protocolos Personalizados</h1>
            <p className="text-muted-foreground">
              Crie e gerencie protocolos estéticos personalizados com IA
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat-ia" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Chat IA</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Manual</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat-ia" className="space-y-6">
          <ChatProtocoloIA onProtocolGenerated={(protocol) => console.log('Protocol generated:', protocol)} />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <HistoricoProtocolos
            protocols={protocols}
            isLoading={isLoading}
            error={error}
            refetchProtocols={refetchProtocols}
            onEditProtocol={handleEditProtocol}
          />
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Protocolo Manual</h3>
            <p className="text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProtocolosPersonalizados;