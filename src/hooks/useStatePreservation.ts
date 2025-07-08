import { useState, useEffect, useCallback } from 'react';
import tabStateManager from '../utils/TabStateManager';

/**
 * Hook para preservar o estado entre abas e recarregamentos
 * @param key Chave única para identificar o estado
 * @param initialValue Valor inicial
 * @param options Opções adicionais
 * @returns [state, setState, metadata]
 */
export function useStatePreservation<T>(
  key: string,
  initialValue: T,
  options: {
    /**
     * Se verdadeiro, o estado será sincronizado entre abas
     */
    syncBetweenTabs?: boolean;
    /**
     * Se verdadeiro, o estado será persistido no localStorage
     */
    persistToStorage?: boolean;
    /**
     * Tempo máximo (em ms) para manter o estado preservado
     */
    maxPreservationTime?: number;
    /**
     * Função para validar o estado ao restaurar
     */
    validator?: (value: any) => boolean;
  } = {}
): [T, React.Dispatch<React.SetStateAction<T>>, { lastUpdated: number | null; isRestored: boolean }] {
  // Extrair opções com valores padrão
  const {
    syncBetweenTabs = true,
    persistToStorage = true,
    maxPreservationTime = 30 * 60 * 1000, // 30 minutos por padrão
    validator = () => true,
  } = options;

  // Prefixo para chaves de armazenamento
  const storageKey = `cliniks_state_${key}`;

  // Estado local e metadados
  const [state, setState] = useState<T>(() => {
    // Tentar restaurar do localStorage se persistToStorage estiver ativado
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        const storedItem = localStorage.getItem(storageKey);
        if (storedItem) {
          const { value, timestamp } = JSON.parse(storedItem);
          
          // Verificar se o estado ainda é válido (não expirou)
          const isExpired = Date.now() - timestamp > maxPreservationTime;
          
          // Validar o valor restaurado
          if (!isExpired && validator(value)) {
            return value;
          }
          
          // Se expirou ou é inválido, remover do localStorage
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('Erro ao restaurar estado do localStorage:', error);
      }
    }
    
    // Retornar valor inicial se não foi possível restaurar
    return initialValue;
  });

  // Metadados do estado
  const [metadata, setMetadata] = useState<{ lastUpdated: number | null; isRestored: boolean }>({
    lastUpdated: null,
    isRestored: false,
  });

  // Função para persistir o estado
  const persistState = useCallback((newState: T) => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        const timestamp = Date.now();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            value: newState,
            timestamp,
          })
        );
      } catch (error) {
        console.error('Erro ao persistir estado no localStorage:', error);
      }
    }
  }, [persistToStorage, storageKey]);

  // Efeito para sincronizar o estado entre abas
  useEffect(() => {
    if (!syncBetweenTabs) return;

    // Função para lidar com mensagens de outras abas
    const handleTabMessage = (message: any) => {
      if (message.type === 'STATE_UPDATE' && message.key === key) {
        // Validar o valor recebido
        if (validator(message.data)) {
          setState(message.data);
          setMetadata({
            lastUpdated: message.timestamp,
            isRestored: true,
          });
        }
      }
    };

    // Registrar listener para mensagens de outras abas
    const unsubscribe = tabStateManager.onMessage(handleTabMessage);

    // Efeito para lidar com eventos de restauração de estado
    const handleStateRestored = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail[key]) {
        // Validar o valor restaurado
        const restoredValue = customEvent.detail[key];
        if (validator(restoredValue)) {
          setState(restoredValue);
          setMetadata({
            lastUpdated: Date.now(),
            isRestored: true,
          });
        }
      }
    };

    // Registrar listener para eventos de restauração de estado
    window.addEventListener('stateRestored', handleStateRestored);

    // Limpar listeners ao desmontar
    return () => {
      unsubscribe();
      window.removeEventListener('stateRestored', handleStateRestored);
    };
  }, [key, syncBetweenTabs, validator]);

  // Efeito para persistir o estado e atualizar metadados quando o estado muda
  useEffect(() => {
    // Armazenar o estado atual no localStorage
    persistState(state);

    // Atualiza os metadados de forma segura
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      lastUpdated: Date.now(),
    }));

    // Se a sincronização entre abas estiver ativa, notificar outras abas
    if (syncBetweenTabs) {
      tabStateManager.sendMessage(
        'STATE_UPDATE',
        {
          key,
          data: state,
          timestamp: Date.now(),
        }
      );
    }
  }, [state, persistState, syncBetweenTabs, key]);

  // Efeito para salvar o estado quando a aba perde o foco
  useEffect(() => {
    const handleTabBlur = () => {
      persistState(state);
    };

    // Registrar listeners para eventos de foco/blur
    window.addEventListener('tabBlurred', handleTabBlur);
    
    // Limpar listeners ao desmontar
    return () => {
      window.removeEventListener('tabBlurred', handleTabBlur);
    };
  }, [state, persistState]);

  return [state, setState, metadata];
}

export default useStatePreservation;
