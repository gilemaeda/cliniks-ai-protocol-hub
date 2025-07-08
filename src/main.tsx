import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrar o Service Worker para preservação de estado entre abas
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.error('Erro ao registrar Service Worker:', error);
      });
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);

// Gerenciador de estado entre abas
class TabStateManager {
  private static lastFocusTime = Date.now();
  private static preservationActive = false;
  private static serviceWorkerReady = false;

  static init() {
    // Registrar o Service Worker para preservar o estado entre mudanças de aba
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registrado com sucesso:', registration.scope);
            this.serviceWorkerReady = true;
            
            // Verificar se o Service Worker já está controlando a página
            if (navigator.serviceWorker.controller) {
              console.log('Service Worker já está controlando esta página');
            }
          })
          .catch(error => {
            console.error('Erro ao registrar Service Worker:', error);
          });
      });

      // Adicionar evento para evitar recarregamento ao voltar para a aba
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('focus', this.handleFocus.bind(this));
      window.addEventListener('blur', this.handleBlur.bind(this));
      
      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'STATE_PRESERVED') {
          console.log('Estado preservado pelo Service Worker:', event.data.timestamp);
          this.preservationActive = true;
        }
      });
    }
  }

  static handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.handleFocus();
    } else {
      this.handleBlur();
    }
  }

  static handleFocus() {
    // Se voltou a ficar visível em menos de 5 minutos, prevenir recarregamento
    const timeSinceLastFocus = Date.now() - this.lastFocusTime;
    if (timeSinceLastFocus < 5 * 60 * 1000) {
      this.preserveState();
    }
    
    // Disparar evento personalizado que componentes podem escutar
    window.dispatchEvent(new CustomEvent('app:tabFocused', {
      detail: { timeSinceLastFocus }
    }));
  }

  static handleBlur() {
    // Atualiza o timestamp quando a aba perde o foco
    this.lastFocusTime = Date.now();
    
    // Disparar evento personalizado que componentes podem escutar
    window.dispatchEvent(new CustomEvent('app:tabBlurred'));
    
    // Tentar preservar o estado imediatamente ao sair
    this.preserveState();
  }

  static preserveState() {
    if (this.serviceWorkerReady && navigator.serviceWorker.controller) {
      // Envia mensagem para o Service Worker manter o cache
      navigator.serviceWorker.controller.postMessage({
        type: 'PRESERVE_STATE',
        timestamp: Date.now(),
        url: window.location.href
      });
      
      console.log('Solicitação de preservação de estado enviada ao Service Worker');
    }
  }
}

// Inicializar o gerenciador de estado entre abas
TabStateManager.init();

// Exportar para uso em outros componentes
window.TabStateManager = TabStateManager;
