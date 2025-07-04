import { useState, useEffect, useCallback } from 'react';

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Hook para persistir estado entre recarregamentos de página
 * @param key Chave única para identificar o estado no storage
 * @param initialValue Valor inicial caso não exista no storage
 * @param storage Tipo de storage a ser utilizado (localStorage ou sessionStorage)
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storage: StorageType = 'localStorage'
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  // Função para obter o valor inicial do storage ou usar o valor padrão
  const getStoredValue = useCallback((): T => {
    try {
      const item = window[storage].getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao recuperar "${key}" do ${storage}:`, error);
      return initialValue;
    }
  }, [key, initialValue, storage]);

  // Estado local com valor inicial do storage
  const [value, setValue] = useState<T>(getStoredValue);

  // Função para limpar o valor do storage
  const clearValue = useCallback(() => {
    try {
      window[storage].removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error(`Erro ao remover "${key}" do ${storage}:`, error);
    }
  }, [key, initialValue, storage]);

  // Atualiza o storage quando o valor muda
  useEffect(() => {
    try {
      window[storage].setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar "${key}" no ${storage}:`, error);
    }
  }, [key, value, storage]);

  // Atualiza o valor quando o storage muda em outra aba/janela
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window[storage]) {
        setValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
      }
    };

    // Adiciona listener para o evento storage
    window.addEventListener('storage', handleStorageChange);
    
    // Adiciona listener para o evento visibilitychange
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recarrega o valor do storage quando a página volta a ter foco
        setValue(getStoredValue());
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [key, initialValue, storage, getStoredValue]);

  return [value, setValue, clearValue];
}
