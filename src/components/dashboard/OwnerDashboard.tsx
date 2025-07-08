import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/authContext';
import ClinicStats from './ClinicStats';
import MainTools from '@/components/dashboard/MainTools'; // Importar MainTools

const OwnerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return null; // ou um spinner de carregamento
  }

  return (
    <div className="min-h-screen bg-[#424242]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Adiciona o componente de estatísticas */}
        <div className="mb-8">
          <ClinicStats />
        </div>

        {/* Adiciona as ferramentas principais de volta */}
        <MainTools />
      </div>
    </div>
  );
};

export default OwnerDashboard;
