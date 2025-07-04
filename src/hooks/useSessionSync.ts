import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para sincronizar sessões entre abas e detectar mudanças de autenticação
 * @param onSessionChange Callback executado quando a sessão muda
 */
export const useSessionSync = (onSessionChange: () => void) => {
  useEffect(() => {
    // Listener para mudanças de autenticação no Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log('Evento de autenticação detectado:', event);
      
      // Eventos que indicam mudança de sessão
      if (
        event === 'SIGNED_IN' || 
        event === 'SIGNED_OUT' || 
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        onSessionChange();
      }
    });

    // Listener para eventos de storage (detecta mudanças em outras abas)
    const handleStorageChange = (event: StorageEvent) => {
      // Chaves relacionadas à autenticação do Supabase
      const authKeys = ['supabase.auth.token', 'supabase.auth.refreshToken'];
      
      if (event.key && authKeys.includes(event.key)) {
        console.log('Mudança de autenticação detectada em outra aba');
        onSessionChange();
      }
    };

    // Adicionar listener para eventos de storage
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onSessionChange]);
};
