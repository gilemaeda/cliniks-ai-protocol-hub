
import { useAuth } from '@/hooks/auth/authContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'clinic_owner' | 'professional' | 'admin';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { canAccess, isChecking: accessChecking } = useAccessControl();
  const location = useLocation();

  const isLoading = authLoading || accessChecking;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access to dashboard, subscription and configuration pages regardless of plan status,
  // so users can see the locked UI, manage their subscription, and update their profile/clinic info.
  const allowedPaths = [
    '/dashboard', 
    '/assinaturas', 
    '/configuracao', 
    '/configuracao/clinica', 
    '/configuracao/profissional',
    // As rotas reais usadas no App.tsx
    '/configuracao-clinica',
    '/configuracao-profissional'
  ];
  
  // Verificar se o caminho atual começa com algum dos caminhos permitidos
  const isAllowedPath = allowedPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );
  
  console.log('Caminho atual:', location.pathname, 'Acesso permitido:', isAllowedPath);
  
  // Restrição de acesso baseada no tipo de perfil
  if (profile) {
    // Apenas proprietários podem acessar a configuração da clínica
    if (location.pathname === '/configuracao-clinica' && profile.role !== 'clinic_owner') {
      console.log('Acesso negado: apenas proprietários podem acessar a configuração da clínica');
      return <Navigate to="/dashboard" replace />;
    }
    
    // Apenas profissionais podem acessar a configuração do profissional
    if (location.pathname === '/configuracao-profissional' && profile.role !== 'professional') {
      console.log('Acesso negado: apenas profissionais podem acessar a configuração do profissional');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // Verificação de acesso baseada no status do plano
  if (!canAccess && !isAllowedPath) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
