import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import { Navigate } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import QuickActions from '@/components/dashboard/QuickActions';
import PlatformInfo from '@/components/dashboard/PlatformInfo';
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard';
import MainTools from '@/components/dashboard/MainTools';
import { Loader2 } from 'lucide-react';
import { FixUserRecords } from '@/components/auth/FixUserRecords';

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { clinic, loading: clinicLoading } = useClinic();

  console.log('Dashboard - Current state:', { user: !!user, profile: profile?.role, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) { // loading is already false here due to the check above
    console.log('Dashboard - No user and not loading, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // At this point, user is true and loading is false.
  if (!profile) {
    console.log('Dashboard - User exists, but no profile after loading. Displaying error/message.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            Não foi possível carregar as informações do seu perfil.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Por favor, tente recarregar a página ou entre em contato com o suporte se o problema persistir.
          </p>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // If we reach here, user and profile are available, and loading is false.
  console.log('Dashboard - User role:', profile.role);

  if (profile.role === 'professional') {
    return <ProfessionalDashboard />;
  }

  // Dashboard para proprietários de clínica
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Componente de correção de registros */}
        <FixUserRecords />
        
        {/* Ferramentas Principais */}
        <MainTools />
        
        {/* Ações Rápidas */}
        <div className="mb-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Ações Rápidas
          </h2>
          <QuickActions />
        </div>

        {/* Informações da Plataforma */}
        <PlatformInfo />
      </div>
    </div>
  );
};

export default Dashboard;
