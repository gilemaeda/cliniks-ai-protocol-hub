import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { isAdmin, adminLoading, adminUser } = useAdmin();

  // Adicionar logs para diagnóstico
  useEffect(() => {
    if (adminLoading) {
      console.log('ProtectedAdminRoute: Verificando autenticação administrativa...');
    } else if (isAdmin && adminUser) {
      console.log(`ProtectedAdminRoute: Usuário autenticado como admin: ${adminUser.email} (${adminUser.is_master ? 'Master' : 'Regular'})`);
    } else {
      console.warn('ProtectedAdminRoute: Acesso administrativo negado, redirecionando para login');
    }
  }, [adminLoading, isAdmin, adminUser]);

  // Mostrar loader enquanto verifica a autenticação
  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAdmin) {
    console.warn('ProtectedAdminRoute: Redirecionando para página de login administrativo');
    return <Navigate to="/admin-login" replace />;
  }

  // Renderizar o conteúdo protegido se estiver autenticado
  return <>{children}</>;
};

export default ProtectedAdminRoute;
