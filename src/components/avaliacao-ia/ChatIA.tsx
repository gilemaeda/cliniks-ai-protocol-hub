
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatIA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mensagem inicial do chat
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Olá! 👋 Eu sou a IA especializada em estética da Cliniks IA Portal. Como posso ajudá-lo hoje? Posso esclarecer dúvidas sobre tratamentos, protocolos estéticos, cuidados com a pele e muito mais!',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    // Auto scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const splitLongMessage = (message: string, maxLength: number = 300): string[] => {
    if (message.length <= maxLength) {
      return [message];
    }

    const sentences = message.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          // Se uma frase é muito longa, dividir por palavras
          const words = sentence.split(' ');
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + word).length <= maxLength) {
              wordChunk += (wordChunk ? ' ' : '') + word;
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          if (wordChunk) currentChunk = wordChunk;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const addMessageWithTyping = async (content: string, role: 'user' | 'assistant') => {
    if (role === 'assistant') {
      setIsTyping(true);
      
      const messageChunks = splitLongMessage(content);
      
      for (let i = 0; i < messageChunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de delay
        
        const newMessage: Message = {
          id: Date.now().toString() + i,
          role: 'assistant',
          content: messageChunks[i],
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
      
      setIsTyping(false);
    } else {
      const newMessage: Message = {
        id: Date.now().toString(),
        role,
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Adicionar mensagem do usuário
    await addMessageWithTyping(userMessage, 'user');

    try {
      console.log('Enviando mensagem para a IA...');
      
      const { data, error } = await supabase.functions.invoke('chat-ia', {
        body: {
          message: userMessage,
          conversation_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) {
        console.error('Erro na função chat-ia:', error);
        throw error;
      }

      console.log('Resposta da IA recebida:', data);

      if (data?.response) {
        await addMessageWithTyping(data.response, 'assistant');
      } else {
        throw new Error('Resposta inválida da IA');
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      await addMessageWithTyping(
        'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        'assistant'
      );
      
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível processar sua mensagem. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chat com IA Especializada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Converse com nossa inteligência artificial especializada em estética
            </p>
          </div>
        </div>
      </div>

      {/* Informações */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <p className="text-sm text-purple-700 dark:text-purple-300">
          <strong>💡 Dica:</strong> Este chat utiliza o prompt personalizado configurado no Painel Administrativo, garantindo respostas especializadas para sua área.
        </p>
      </div>

      {/* Chat Container */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-500" />
            <span>Assistente IA Estética</span>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea 
            ref={scrollAreaRef}
            className="flex-1 px-6 py-4 max-h-[400px] overflow-y-auto"
          >
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
                      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mr-2">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t px-6 py-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre estética..."
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
            
            <p className="text-xs text-gray-500 mt-2">
              Pressione Enter para enviar ou Shift+Enter para quebrar linha
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatIA;
