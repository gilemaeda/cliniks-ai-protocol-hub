import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStatePreservation } from '@/hooks/useStatePreservation';
import tabStateManager from '@/utils/TabStateManager';

/**
 * Componente de teste para verificar a preservação de estado entre abas
 * Este componente demonstra como o useStatePreservation e TabStateManager
 * trabalham juntos para preservar o estado ao alternar entre abas
 */
const FormPreservationTest: React.FC = () => {
  // Usar o hook useStatePreservation para campos de formulário
  const [nome, setNome] = useStatePreservation<string>(
    'test_nome',
    '',
    { syncBetweenTabs: true }
  );
  
  const [email, setEmail] = useStatePreservation<string>(
    'test_email',
    '',
    { syncBetweenTabs: true }
  );
  
  const [mensagem, setMensagem] = useStatePreservation<string>(
    'test_mensagem',
    '',
    { syncBetweenTabs: true }
  );

  // Estado para rastrear eventos de visibilidade
  const [visibilityEvents, setVisibilityEvents] = useState<string[]>([]);
  const [tabId, setTabId] = useState<string>('');
  const [connectedTabs, setConnectedTabs] = useState<string[]>([]);

  // Efeito para configurar listeners de eventos de visibilidade
  useEffect(() => {
    // Obter ID da aba atual
    setTabId(tabStateManager['tabId']);

    // Registrar listener para mensagens de outras abas
    const unsubscribe = tabStateManager.onMessage((message) => {
      if (message.type === 'TAB_CONNECTED') {
        setConnectedTabs((tabs) => {
          if (tabs.includes(message.tabId)) return tabs;
          return [...tabs, message.tabId];
        });
        
        setVisibilityEvents((events) => [
          `Aba ${message.tabId.substring(0, 8)}... conectada (${new Date().toLocaleTimeString()})`,
          ...events
        ]);
      } else if (message.type === 'TAB_DISCONNECTED') {
        setConnectedTabs((tabs) => tabs.filter(id => id !== message.tabId));
        
        setVisibilityEvents((events) => [
          `Aba ${message.tabId.substring(0, 8)}... desconectada (${new Date().toLocaleTimeString()})`,
          ...events
        ]);
      } else if (message.type === 'STATE_UPDATE') {
        setVisibilityEvents((events) => [
          `Estado atualizado de outra aba: ${message.key} (${new Date().toLocaleTimeString()})`,
          ...events
        ]);
      }
    });

    // Configurar listeners para eventos de visibilidade
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setVisibilityEvents((events) => [
        `Visibilidade alterada: ${isVisible ? 'visível' : 'oculta'} (${new Date().toLocaleTimeString()})`,
        ...events
      ]);
    };

    // Configurar listeners para eventos de foco/blur
    const handleFocus = () => {
      setVisibilityEvents((events) => [
        `Janela ganhou foco (${new Date().toLocaleTimeString()})`,
        ...events
      ]);
    };

    const handleBlur = () => {
      setVisibilityEvents((events) => [
        `Janela perdeu foco (${new Date().toLocaleTimeString()})`,
        ...events
      ]);
    };

    // Configurar listeners para eventos personalizados
    const handleTabFocused = () => {
      setVisibilityEvents((events) => [
        `Evento tabFocused disparado (${new Date().toLocaleTimeString()})`,
        ...events
      ]);
    };

    const handleTabBlurred = () => {
      setVisibilityEvents((events) => [
        `Evento tabBlurred disparado (${new Date().toLocaleTimeString()})`,
        ...events
      ]);
    };

    // Registrar todos os listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('tabFocused', handleTabFocused);
    window.addEventListener('tabBlurred', handleTabBlurred);

    // Limpar todos os listeners ao desmontar
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('tabFocused', handleTabFocused);
      window.removeEventListener('tabBlurred', handleTabBlurred);
    };
  }, []);

  // Função para limpar o formulário
  const handleClear = () => {
    setNome('');
    setEmail('');
    setMensagem('');
    setVisibilityEvents([]);
  };

  // Função para abrir uma nova aba com o mesmo formulário
  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Teste de Preservação de Estado</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Preencha o formulário, abra uma nova aba e alterne entre elas para testar a preservação de estado
        </p>
        <div className="text-center text-xs bg-muted p-2 rounded">
          ID desta aba: <span className="font-mono">{tabId.substring(0, 12)}...</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Formulário de teste */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome"
              data-preserve="true"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              data-preserve="true"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem"
              rows={4}
              data-preserve="true"
            />
          </div>
          
          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={handleClear}>
              Limpar Formulário
            </Button>
            <Button onClick={handleOpenNewTab}>
              Abrir Nova Aba
            </Button>
          </div>
        </div>
        
        {/* Informações sobre eventos de visibilidade */}
        <div className="space-y-2 border-t pt-4">
          <h3 className="font-medium">Eventos de Visibilidade</h3>
          <div className="bg-muted p-2 rounded h-40 overflow-y-auto text-xs">
            {visibilityEvents.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhum evento registrado</p>
            ) : (
              <ul className="space-y-1">
                {visibilityEvents.map((event, index) => (
                  <li key={index} className="font-mono">{event}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Informações sobre abas conectadas */}
        <div className="space-y-2 border-t pt-4">
          <h3 className="font-medium">Abas Conectadas ({connectedTabs.length})</h3>
          <div className="bg-muted p-2 rounded max-h-20 overflow-y-auto text-xs">
            {connectedTabs.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhuma outra aba conectada</p>
            ) : (
              <ul className="space-y-1">
                {connectedTabs.map((tab, index) => (
                  <li key={index} className="font-mono">{tab.substring(0, 12)}...</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Este componente demonstra como o estado é preservado entre abas usando TabStateManager e useStatePreservation.
          </p>
          <p>
            Experimente preencher o formulário, abrir uma nova aba e alternar entre elas para ver o estado sendo preservado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormPreservationTest;
