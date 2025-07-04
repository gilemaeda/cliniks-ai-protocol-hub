import { useAuth } from '@/hooks/auth/authContext';
import { Navigate } from 'react-router-dom';
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard';

// Dashboard original restaurado
const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#424242]/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f00fa] mx-auto mb-4"></div>
          <p className="text-[#424242]/80">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Renderiza o Dashboard profissional completo
  return <ProfessionalDashboard />;
};

export default Dashboard;
