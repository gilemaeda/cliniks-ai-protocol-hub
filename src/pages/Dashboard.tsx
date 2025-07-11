import { useAuth } from '@/hooks/auth/authContext';
import { Navigate } from 'react-router-dom';
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';

// Dashboard original restaurado
const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  // Mostra o spinner enquanto a sessão ou o perfil estiverem carregando
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#424242]/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f00fa] mx-auto mb-4"></div>
          <p className="text-[#424242]/80">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário após o carregamento, redireciona para o login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Renderiza o dashboard correto com base no perfil do usuário
  if (profile.role === 'clinic_owner') {
    return <OwnerDashboard />;
  }

  return <ProfessionalDashboard />;
};

export default Dashboard;
