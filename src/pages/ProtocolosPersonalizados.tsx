
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, History, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatProtocoloIA from '@/components/protocolos/ChatProtocoloIA';
import HistoricoProtocolos from '@/components/protocolos/HistoricoProtocolos';
import ProtocoloEditor from '@/components/protocolos/ProtocoloEditor';
import ProtocoloManual from '@/components/protocolos/ProtocoloManual';
import { Protocol } from '@/hooks/useProtocolosQuery';

const ProtocolosPersonalizados = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat-ia');
  const [editingProtocol, setEditingProtocol] = useState<Partial<Protocol> | null>(null);

    const handleProtocolGenerated = (protocolContent: string) => {
    const newProtocol: Partial<Protocol> = {
      name: 'Protocolo via Chat',
      description: 'Protocolo gerado a partir da conversa com a IA.',
      content: protocolContent,
    };
    setEditingProtocol(newProtocol);
    setActiveTab('editor');
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
            <ProtocoloManual onProtocolCreated={handleProtocolCreated} />
          </TabsContent>

          <TabsContent value="editor">
            {editingProtocol ? (
              <ProtocoloEditor 
                protocol={editingProtocol} 
                onBack={handleBackToNew}
                onSave={handleSaveProtocol}
              />
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Gere um protocolo primeiro para poder editá-lo
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoProtocolos onEditProtocol={handleEditProtocol} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProtocolosPersonalizados;
