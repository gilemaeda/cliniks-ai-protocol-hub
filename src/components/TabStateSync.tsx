import React, { useEffect, useState } from 'react';
import tabStateManager from '../utils/TabStateManager';

interface TabStateSyncProps {
  /**
   * Componentes filhos
   */
  children: React.ReactNode;
  /**
   * Função chamada quando o estado é sincronizado entre abas
   */
  onSync?: (data: any) => void;
  /**
   * Função chamada quando uma nova aba é detectada
   */
  onTabConnected?: (tabId: string) => void;
  /**
   * Função chamada quando uma aba é fechada
   */
  onTabDisconnected?: (tabId: string) => void;
}

/**
 * Componente que sincroniza o estado entre abas
 * Deve ser colocado próximo à raiz da aplicação
 */
const TabStateSync: React.FC<TabStateSyncProps> = ({
  children,
  onSync,
  onTabConnected,
  onTabDisconnected
}) => {
  // Estado para rastrear abas conectadas
  const [connectedTabs, setConnectedTabs] = useState<string[]>([]);
  
  // Efeito para inicializar o gerenciador de estado e configurar listeners
  useEffect(() => {
    // Garantir que o TabStateManager esteja inicializado
    tabStateManager.initialize().catch(console.error);
    
    // Registrar listener para mensagens de outras abas
    const unsubscribe = tabStateManager.onMessage((message) => {
      if (!message || !message.type) return;
      
      switch (message.type) {
        case 'TAB_CONNECTED':
          // Nova aba conectada
          setConnectedTabs((tabs) => {
            if (tabs.includes(message.tabId)) return tabs;
            const newTabs = [...tabs, message.tabId];
            if (onTabConnected) onTabConnected(message.tabId);
            return newTabs;
          });
          break;
          
        case 'TAB_DISCONNECTED':
          // Aba desconectada
          setConnectedTabs((tabs) => {
            const newTabs = tabs.filter((id) => id !== message.tabId);
            if (onTabDisconnected) onTabDisconnected(message.tabId);
            return newTabs;
          });
          break;
          
        case 'STATE_UPDATE':
          // Atualização de estado de outra aba
          if (onSync) onSync(message.data);
          break;
      }
    });
    
    // Configurar listeners para eventos de visibilidade
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quando a aba volta a ficar visível, disparar evento para sincronizar estado
        window.dispatchEvent(new CustomEvent('tabFocused'));
      } else {
        // Quando a aba perde foco, salvar estado atual
        window.dispatchEvent(new CustomEvent('tabBlurred'));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Configurar listeners para eventos de foco/blur da janela
    window.addEventListener('focus', () => {
      window.dispatchEvent(new CustomEvent('tabFocused'));
    });
    
    window.addEventListener('blur', () => {
      window.dispatchEvent(new CustomEvent('tabBlurred'));
    });
    
    // Configurar listener para evento de restauração de estado
    const handleStateRestored = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && onSync) {
        onSync(customEvent.detail);
      }
    };
    
    window.addEventListener('stateRestored', handleStateRestored);
    
    // Limpar listeners ao desmontar
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => {
        window.dispatchEvent(new CustomEvent('tabFocused'));
      });
      window.removeEventListener('blur', () => {
        window.dispatchEvent(new CustomEvent('tabBlurred'));
      });
      window.removeEventListener('stateRestored', handleStateRestored);
    };
  }, [onSync, onTabConnected, onTabDisconnected]);
  
  // Renderizar componentes filhos sem modificação
  return <>{children}</>;
};

export default TabStateSync;
