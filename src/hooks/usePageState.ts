import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

/**
 * Hook para persistir o estado da página entre navegações
 * Salva parâmetros de URL e outras informações no localStorage
 * e restaura quando o usuário retorna à página
 */
export function usePageState() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Salva o estado atual no localStorage quando o componente é montado
  // ou quando a localização/parâmetros mudam
  useEffect(() => {
    const currentState = {
      pathname: location.pathname,
      search: location.search,
      params: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem('cliniks_page_state', JSON.stringify(currentState));
    
    // Função para salvar o estado quando o usuário sai da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('cliniks_page_state', JSON.stringify(currentState));
      }
    };
    
    // Adiciona listener para detectar quando o usuário sai da página
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, location.search, searchParams]);

  // Restaura o estado quando o componente é montado
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // Se a página está sendo restaurada do cache do navegador (BFCache)
      if (event.persisted) {
        console.log('Página restaurada do BFCache');
      }
    };

    // Adiciona listener para o evento pageshow
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return {
    // Função para restaurar o estado da página
    restoreState: () => {
      try {
        const savedState = localStorage.getItem('cliniks_page_state');
        if (savedState) {
          const state = JSON.parse(savedState);
          return state;
        }
      } catch (error) {
        console.error('Erro ao restaurar estado da página:', error);
      }
      return null;
    }
  };
}
