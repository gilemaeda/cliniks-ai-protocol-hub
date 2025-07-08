import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Hook personalizado para preservar o estado entre alternância de abas e recarregamentos.
 * Funciona como um useState normal, mas salva o valor no localStorage para persistência.
 * 
 * @param key Chave única para identificar o estado no localStorage
 * @param initialValue Valor inicial do estado
 * @returns [state, setState] - Similar ao useState padrão
 */
export function useStatePreservation<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Função para obter o valor inicial
  const getInitialValue = useCallback((): T => {
    try {
      // Verificar se há um valor salvo no localStorage
      const item = localStorage.getItem(key);
      
      // Se existir, retornar o valor parseado
      if (item) {
        return JSON.parse(item);
      }
      
      // Caso contrário, retornar o valor inicial
      return initialValue;
    } catch (error) {
      console.error(`Erro ao recuperar estado '${key}' do localStorage:`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // Criar o estado com o valor inicial (do localStorage ou o fornecido)
  const [state, setState] = useState<T>(getInitialValue);

  // Função para salvar o estado no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Erro ao salvar estado '${key}' no localStorage:`, error);
    }
  }, [key, state]);

  // Função para limpar o estado quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Não limpar o localStorage ao desmontar para preservar entre navegações
      // Apenas registrar para debug
      console.debug(`Estado '${key}' preservado no localStorage`);
    };
  }, [key]);

  // Função para atualizar o estado e o localStorage
  const setStateAndStorage: Dispatch<SetStateAction<T>> = useCallback((value) => {
    setState((prevState) => {
      // Lidar com função de atualização (como em setState(prev => prev + 1))
      const newValue = value instanceof Function ? value(prevState) : value;
      
      try {
        // Salvar imediatamente no localStorage para garantir persistência
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Erro ao salvar estado '${key}' no localStorage:`, error);
      }
      
      return newValue;
    });
  }, [key]);

  // Adicionar listener para eventos de storage para sincronizar entre abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const newValue = JSON.parse(event.newValue);
          setState(newValue);
        } catch (error) {
          console.error(`Erro ao processar mudança de storage para '${key}':`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  // Adicionar listener para eventos de visibilidade para recarregar do localStorage
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const storedValue = JSON.parse(item);
            setState(storedValue);
          }
        } catch (error) {
          console.error(`Erro ao recarregar estado '${key}' do localStorage:`, error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [key]);

  return [state, setStateAndStorage];
}
