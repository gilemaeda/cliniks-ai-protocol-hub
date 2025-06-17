
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClinicStats from '@/components/dashboard/ClinicStats';

const EstatisticasClinica = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Estatísticas da Clínica
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Visão completa dos dados e métricas da sua clínica
                </p>
              </div>
            </div>
          </div>
        </div>

        <ClinicStats />
      </div>
    </div>
  );
};

export default EstatisticasClinica;
