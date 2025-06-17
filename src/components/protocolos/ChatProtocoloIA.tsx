
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2, Sparkles, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProtocoloIAProps {
  onProtocolGenerated: (protocol: string) => void;
}

const ChatProtocoloIA = ({ onProtocolGenerated }: ChatProtocoloIAProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedProtocol, setGeneratedProtocol] = useState<string | null>(null);
  // indica se o usuário já solicitou a geração final do protocolo
  const [isGeneratingProtocol, setIsGeneratingProtocol] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mensagem inicial do chat
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Olá! 👋 Vou te ajudar a criar um protocolo personalizado para sua clínica. Para gerar o melhor protocolo, preciso de algumas informações:\n\n• **Tema do protocolo** (ex: Verão, Dia das Mães, Pós-férias)\n• **Objetivo terapêutico** (ex: rejuvenescimento, perda de gordura, definição)\n• **Público-alvo** (sexo, faixa etária, perfil)\n• **Data de início e duração desejada**\n• **Equipamentos disponíveis**\n• **Substâncias ou ativos disponíveis**\n\nPode começar me contando sobre que tipo de protocolo você gostaria de criar!',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Envia mensagem normal no chat. Apenas conversa, não gera protocolo final.
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    addMessage(userMessage, 'user');

    try {
      const { data, error } = await supabase.functions.invoke('handle-protocol-chat', {
        body: {
          message: userMessage,
          conversation_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context: 'protocol_chat'
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw error;
      }

      if (data?.protocol) {
        // Sempre trate o retorno como resposta do assistente.
        addMessage(data.protocol, 'assistant');
        // Somente salva como protocolo se estiver em modo de geração explícita
        if (isGeneratingProtocol) {
          setGeneratedProtocol(data.protocol);
        }
      } else {
        throw new Error('Resposta inválida da IA');
      }

    } catch (error) {
      console.error('Erro ao gerar protocolo:', error);
      addMessage(
        'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        'assistant'
      );
      
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível processar sua mensagem",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Após primeira geração concluir, volte flag
      if (isGeneratingProtocol) {
        setIsGeneratingProtocol(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Solicita geração final do protocolo a partir do histórico da conversa
  const handleGenerateProtocol = async () => {
    if (isLoading) return;
    setIsGeneratingProtocol(true);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-protocol-chat', {
        body: {
          message: 'GERAR_PROTOCOLO',
          conversation_history: messages.map(msg => ({ role: msg.role, content: msg.content })),
          context: 'generate_protocol'
        }
      });
      if (error) throw error;
      if (data?.protocol) {
        setGeneratedProtocol(data.protocol);
      } else {
        throw new Error('Protocolo não retornado');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível gerar o protocolo', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsGeneratingProtocol(false);
    }
  };

  const handleSaveProtocol = () => {
    if (generatedProtocol) {
      onProtocolGenerated(generatedProtocol);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span>Criação de Protocolo com IA</span>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-6 py-4 max-h-[450px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    } items-start space-x-2`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white ml-2'
                          : 'bg-purple-500 text-white mr-2'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

            {/* Botão para gerar protocolo após conversa */}
            {!generatedProtocol && messages.length > 1 && (
              <div className="mt-4 text-center">
                <Button
                  variant="secondary"
                  onClick={handleGenerateProtocol}
                  disabled={isLoading || isGeneratingProtocol}
                >
                  {isGeneratingProtocol ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Gerar Protocolo
                </Button>
              </div>
            )}

          <div className="border-t px-6 py-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite suas especificações para o protocolo..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedProtocol && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5 text-green-500" />
              <span>Protocolo Gerado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Protocolo criado com sucesso! Clique no botão abaixo para salvar e editar.
            </p>
            <Button onClick={handleSaveProtocol} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar e Editar Protocolo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChatProtocoloIA;
