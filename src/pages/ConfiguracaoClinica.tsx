
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, Users, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfiguracaoClinica from '@/components/clinic/ConfiguracaoClinica';
import GerenciarProfissionais from '@/components/clinic/GerenciarProfissionais';

const ConfiguracaoClinicaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('configuracao');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'configuracao' || tab === 'profissionais')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
                  Configuração da Clínica
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Gerencie as configurações e profissionais da sua clínica
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configuracao" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Configuração</span>
            </TabsTrigger>
            <TabsTrigger value="profissionais" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Profissionais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuracao">
            <ConfiguracaoClinica />
          </TabsContent>

          <TabsContent value="profissionais">
            <GerenciarProfissionais />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ConfiguracaoClinicaPage;
