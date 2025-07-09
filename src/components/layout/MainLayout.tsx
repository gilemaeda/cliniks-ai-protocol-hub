import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClinic } from '@/hooks/useClinic';
import { usePageState } from '@/hooks/usePageState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type MainLayoutProps = {
  children?: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { clinic, loading, planStatusLabel, trialDaysRemaining } = useClinic();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { restoreState } = usePageState();
  
  // Verificar se estamos em ambiente de desenvolvimento
  const isDevelopment = import.meta.env.DEV;
  
  // Restaurar estado da página quando o componente é montado
  useEffect(() => {
    // Só restaura o estado se não houver parâmetros na URL atual
    // Isso evita sobrescrever parâmetros intencionais
    if (location.search === '') {
      const savedState = restoreState();
      if (savedState && savedState.pathname === location.pathname && savedState.search) {
        console.log('Restaurando estado da página:', savedState);
        // Restaurar os parâmetros de URL salvos
        if (savedState.params && Object.keys(savedState.params).length > 0) {
          setSearchParams(savedState.params, { replace: true });
        }
      }
    }
  }, [location.pathname, location.search, restoreState, setSearchParams]);

  // Detectar quando a página volta a ter foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Página voltou a ter foco');
        // Verificar se houve mudança no estado enquanto a página estava em segundo plano
        const savedState = restoreState();
        if (savedState && savedState.pathname === location.pathname) {
          console.log('Estado restaurado após retorno ao foco');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, restoreState]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: clinic?.brand_colors?.background || '#18181b',
        transition: 'background-color 0.3s',
      }}
    >


      {/* Conteúdo principal */}
      <main className="w-full px-2 sm:px-4 lg:px-8 py-8">
        {children ? children : <Outlet />}
      </main>
    </div>
  );
}
