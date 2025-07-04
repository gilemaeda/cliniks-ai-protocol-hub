
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, History, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/authContext';
import AnamnesisTemplatesList from './AnamnesisTemplatesList';
import PatientAnamnesisForm from './PatientAnamnesisForm';
import AnamnesisHistory from './AnamnesisHistory';

const AnamnesisManager = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');
  const [showForm, setShowForm] = useState(false);
  const [selectedArea, setSelectedArea] = useState<'facial' | 'corporal' | 'capilar'>('facial');

  const handleStartAnamnesis = (area: 'facial' | 'corporal' | 'capilar') => {
    setSelectedArea(area);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setActiveTab('history');
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PatientAnamnesisForm
            selectedArea={selectedArea}
            onCancel={handleFormCancel}
            onSave={handleFormSave}
          />
        </div>
      </div>
    );
  }

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
                  Hub de Anamnese
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Gerencie formulários e histórico de anamnese dos pacientes
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${profile?.role === 'clinic_owner' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
            {profile?.role === 'clinic_owner' && (
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="templates">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                     onClick={() => handleStartAnamnesis('facial')}>
                  <h3 className="text-lg font-semibold mb-2">Anamnese Facial</h3>
                  <p className="text-gray-600 dark:text-gray-400">Formulário específico para avaliação facial</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                     onClick={() => handleStartAnamnesis('corporal')}>
                  <h3 className="text-lg font-semibold mb-2">Anamnese Corporal</h3>
                  <p className="text-gray-600 dark:text-gray-400">Formulário específico para avaliação corporal</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                     onClick={() => handleStartAnamnesis('capilar')}>
                  <h3 className="text-lg font-semibold mb-2">Anamnese Capilar</h3>
                  <p className="text-gray-600 dark:text-gray-400">Formulário específico para avaliação capilar</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <AnamnesisHistory />
          </TabsContent>

          {profile?.role === 'clinic_owner' && (
            <TabsContent value="settings">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Configurações de Templates
                </h3>
                <p className="text-gray-500 mb-4">
                  Em breve você poderá personalizar e criar novos templates
                </p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AnamnesisManager;
