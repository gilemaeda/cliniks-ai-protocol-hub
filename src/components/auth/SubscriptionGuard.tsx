import { useAuth } from '@/hooks/auth/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const FullScreenLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="w-full max-w-md p-8 space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const PendingPaymentScreen = () => {
  const { refreshSubscriptionStatus } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Erro ao atualizar status da assinatura:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm text-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border border-border">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold">Aguardando Confirmação de Pagamento</h2>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Sua assinatura está sendo processada. Você será redirecionado automaticamente assim que o pagamento for confirmado.
          </p>
          
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">O que acontece agora?</h3>
            <ul className="text-sm text-muted-foreground text-left space-y-2">
              <li>1. Seu pagamento está sendo processado pela operadora do cartão</li>
              <li>2. Assim que confirmado, sua assinatura será ativada automaticamente</li>
              <li>3. Você terá acesso imediato a todas as funcionalidades</li>
            </ul>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <span className="flex items-center justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2"></span>
              Verificando...
            </span>
          ) : (
            'Verificar Status do Pagamento'
          )}
        </button>
        
        <p className="text-xs text-muted-foreground">
          Se você já concluiu o pagamento e esta tela continua aparecendo, clique no botão acima para atualizar o status.
        </p>
      </div>
    </div>
  );
};


const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { profile, subscriptionStatus, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);
  
  // Verificação de assinatura restaurada e aprimorada
  useEffect(() => {
    // Não fazer nada enquanto estiver carregando
    if (loading) {
      console.log('SubscriptionGuard: Carregando dados...');
      return;
    }
    
    console.log('SubscriptionGuard: Dados carregados', { 
      profile: profile?.role, 
      subscriptionStatus, 
      path: location.pathname 
    });

    // Não redirecionar se já estiver na página de assinatura ou login
    const isAuthPage = location.pathname === '/login' || 
                       location.pathname === '/cadastro' || 
                       location.pathname === '/assinatura' ||
                       location.pathname === '/recuperar-senha';
    
    if (isAuthPage) {
      console.log('SubscriptionGuard: Já está em página de autenticação/assinatura');
      return;
    }

    // Verificar se o usuário tem permissão para acessar
    if (profile && !hasRedirectedRef.current) {
      // Se for admin ou professional, permitir acesso independente de assinatura
      if (profile.role === 'admin' || profile.role === 'professional') {
        console.log(`SubscriptionGuard: Acesso liberado para ${profile.role}`);
        return;
      }
      
      // Se for clinic_owner, verificar status da assinatura
      if (profile.role === 'clinic_owner') {
        // Se não tiver assinatura ou status for pending, redirecionar para página de assinatura
        if (!subscriptionStatus || subscriptionStatus === 'pending') {
          console.log('SubscriptionGuard: Redirecionando para /assinatura - status pending ou sem assinatura');
          hasRedirectedRef.current = true;
          navigate('/assinatura', { replace: true });
          return;
        }
        
        // Se assinatura não estiver ativa (cancelada, atrasada, etc), redirecionar para página de assinatura
        if (subscriptionStatus !== 'ACTIVE' && subscriptionStatus !== 'TRIAL') {
          console.log(`SubscriptionGuard: Redirecionando para /assinatura - status ${subscriptionStatus}`);
          hasRedirectedRef.current = true;
          navigate('/assinatura', { replace: true });
          return;
        }
        
        console.log(`SubscriptionGuard: Acesso liberado para clinic_owner com status ${subscriptionStatus}`);
      }
    }
  }, [profile, subscriptionStatus, loading, location.pathname, navigate]);

  // Resetar flag de redirecionamento quando mudar de rota
  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [location.pathname]);
  
  if (loading) {
    return <FullScreenLoader />;
  }
  
  // Mostrar tela de pagamento pendente se o status for pending
  if (profile?.role === 'clinic_owner' && subscriptionStatus === 'pending') {
    return <PendingPaymentScreen />;
  }
  
  return <>{children}</>;
};

export default SubscriptionGuard;
