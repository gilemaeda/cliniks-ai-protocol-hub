/**
 * TabStateManager - Gerencia o estado entre abas e integra com o Service Worker
 * para evitar recarregamento ao alternar entre abas
 */
class TabStateManager {
  private static instance: TabStateManager;
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private serviceWorker: ServiceWorker | null = null;
  private isInitialized = false;

  private constructor() {
    // Gerar ID único para esta aba
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Inicializar canal de comunicação entre abas
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('cliniks_tab_state');
      } catch (error) {
        console.error('Erro ao inicializar BroadcastChannel:', error);
      }
    }
  }

  /**
   * Obtém a instância única do TabStateManager (Singleton)
   */
  public static getInstance(): TabStateManager {
    if (!TabStateManager.instance) {
      TabStateManager.instance = new TabStateManager();
    }
    return TabStateManager.instance;
  }

  /**
   * Inicializa o gerenciador de estado
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Registrar listeners para eventos de visibilidade
    this.setupVisibilityListeners();
    
    // Conectar ao Service Worker se disponível
    await this.connectToServiceWorker();
    
    // Anunciar esta aba para outras abas
    this.announceTab();
    
    this.isInitialized = true;
    console.log(`TabStateManager inicializado. ID da aba: ${this.tabId}`);
  }

  /**
   * Configura os listeners para eventos de visibilidade da página
   */
  private setupVisibilityListeners(): void {
    // Detectar quando a aba ganha ou perde foco
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.onTabFocused();
      } else {
        this.onTabBlurred();
      }
    });

    // Detectar quando a janela ganha ou perde foco
    window.addEventListener('focus', () => this.onTabFocused());
    window.addEventListener('blur', () => this.onTabBlurred());

    // Detectar quando a página está prestes a ser descarregada
    window.addEventListener('beforeunload', () => {
      this.saveCurrentState();
      this.announceTabClosed();
    });

    // Detectar quando a página é restaurada do BFCache
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('Página restaurada do BFCache');
        this.onTabFocused();
      }
    });
  }

  /**
   * Conecta ao Service Worker se disponível
   */
  private async connectToServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Verificar se há um Service Worker registrado
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration?.active) {
          this.serviceWorker = registration.active;
          
          // Configurar comunicação com o Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event.data);
          });
          
          console.log('Conectado ao Service Worker');
        } else {
          console.log('Service Worker não está ativo');
        }
      } catch (error) {
        console.error('Erro ao conectar ao Service Worker:', error);
      }
    }
  }

  /**
   * Anuncia esta aba para outras abas
   */
  private announceTab(): void {
    if (this.channel) {
      this.channel.postMessage({
        type: 'TAB_CONNECTED',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Anuncia que esta aba está sendo fechada
   */
  private announceTabClosed(): void {
    if (this.channel) {
      this.channel.postMessage({
        type: 'TAB_DISCONNECTED',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Manipula mensagens recebidas do Service Worker
   */
  private handleServiceWorkerMessage(message: any): void {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'STATE_PRESERVED':
        console.log('Estado preservado pelo Service Worker');
        break;
      
      case 'STATE_RESTORED':
        console.log('Estado restaurado pelo Service Worker');
        // Disparar evento personalizado para que componentes possam reagir
        window.dispatchEvent(new CustomEvent('stateRestored', { detail: message.data }));
        break;
    }
  }

  /**
   * Chamado quando a aba ganha foco
   */
  private onTabFocused(): void {
    console.log('Aba ganhou foco');
    
    // Notificar o Service Worker que a aba está ativa
    if (this.serviceWorker) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'TAB_FOCUSED',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }
    
    // Notificar outras abas
    if (this.channel) {
      this.channel.postMessage({
        type: 'TAB_FOCUSED',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }
    
    // Disparar evento para componentes React
    window.dispatchEvent(new CustomEvent('tabFocused'));
  }

  /**
   * Chamado quando a aba perde foco
   */
  private onTabBlurred(): void {
    console.log('Aba perdeu foco');
    
    // Salvar o estado atual antes de perder o foco
    this.saveCurrentState();
    
    // Notificar o Service Worker que a aba está inativa
    if (this.serviceWorker) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'TAB_BLURRED',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }
    
    // Notificar outras abas
    if (this.channel) {
      this.channel.postMessage({
        type: 'TAB_BLURRED',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }
    
    // Disparar evento para componentes React
    window.dispatchEvent(new CustomEvent('tabBlurred'));
  }

  /**
   * Salva o estado atual da aplicação
   */
  private saveCurrentState(): void {
    // Coletar estado atual da aplicação
    const currentState = {
      url: window.location.href,
      timestamp: Date.now(),
      formData: this.collectFormData()
    };
    
    // Salvar no localStorage para persistência entre recarregamentos
    try {
      localStorage.setItem('cliniks_tab_state', JSON.stringify(currentState));
    } catch (error) {
      console.error('Erro ao salvar estado no localStorage:', error);
    }
    
    // Enviar para o Service Worker para preservação
    if (this.serviceWorker) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'PRESERVE_STATE',
        tabId: this.tabId,
        state: currentState,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Coleta dados de formulários na página
   */
  private collectFormData(): Record<string, any> {
    const formData: Record<string, any> = {};
    
    // Coletar dados de formulários com atributo data-preserve="true"
    document.querySelectorAll('form[data-preserve="true"]').forEach((form, index) => {
      const formId = form.id || `form_${index}`;
      const formElements = (form as HTMLFormElement).elements;
      const formValues: Record<string, any> = {};
      
      for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i] as HTMLInputElement;
        if (element.name) {
          formValues[element.name] = element.value;
        }
      }
      
      formData[formId] = formValues;
    });
    
    return formData;
  }

  /**
   * Envia mensagem para outras abas
   */
  public sendMessage(type: string, data?: any): void {
    if (this.channel) {
      this.channel.postMessage({
        type,
        tabId: this.tabId,
        data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Registra um callback para receber mensagens de outras abas
   */
  public onMessage(callback: (message: any) => void): () => void {
    if (!this.channel) return () => {};
    
    const handler = (event: MessageEvent) => {
      // Ignorar mensagens desta mesma aba
      if (event.data.tabId === this.tabId) return;
      callback(event.data);
    };
    
    this.channel.addEventListener('message', handler);
    
    // Retornar função para remover o listener
    return () => {
      this.channel?.removeEventListener('message', handler);
    };
  }
}

// Exportar instância única
export const tabStateManager = TabStateManager.getInstance();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  tabStateManager.initialize().catch(console.error);
}

export default tabStateManager;
