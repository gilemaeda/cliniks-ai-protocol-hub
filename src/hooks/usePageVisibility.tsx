import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar a visibilidade da página e evitar recarregamentos ao alternar entre abas
 * @returns Um objeto com o estado de visibilidade da página
 */
export function usePageVisibility() {
  // Estado para rastrear se a página está visível ou não
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  // Estado para rastrear se a página foi recarregada recentemente
  const [wasReloaded, setWasReloaded] = useState(false);

  useEffect(() => {
    // Função para lidar com mudanças de visibilidade
    const handleVisibilityChange = () => {
      // Atualiza o estado de visibilidade
      setIsVisible(!document.hidden);
      
      // Se a página estava oculta e agora está visível novamente
      if (!document.hidden) {
        // Marca que a página voltou a ficar visível
        setWasReloaded(true);
        
        // Após um curto período, reseta o estado de recarregamento
        setTimeout(() => {
          setWasReloaded(false);
        }, 100);
      }
    };

    // Adiciona o event listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Função de limpeza para remover o event listener
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isVisible, wasReloaded };
}
