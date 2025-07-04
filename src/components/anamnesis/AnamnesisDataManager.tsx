
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Upload, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/authContext';
import AnamnesisDataList from './AnamnesisDataList';
import AnamnesisDataForm from './AnamnesisDataForm';
import AnamnesisUpload from './AnamnesisUpload';
import AnamnesisErrorBoundary from './AnamnesisErrorBoundary';

const AnamnesisDataManager = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial para evitar erros de renderização
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleNewAnamnesis = () => {
    try {
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao abrir nova anamnese:', error);
    }
  };

  const handleUploadAnamnesis = () => {
    try {
      setShowUpload(true);
    } catch (error) {
      console.error('Erro ao abrir upload:', error);
    }
  };

  const handleFormComplete = () => {
    try {
      setShowForm(false);
      setActiveTab('list');
    } catch (error) {
      console.error('Erro ao completar formulário:', error);
    }
  };

  const handleUploadComplete = () => {
    try {
      setShowUpload(false);
      setActiveTab('list');
    } catch (error) {
      console.error('Erro ao completar upload:', error);
    }
  };

  const handleCancel = () => {
    try {
      setShowForm(false);
      setShowUpload(false);
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    }
  };

  const handleNavigateToDashboard = () => {
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao navegar:', error);
      // Tenta navegar novamente com um pequeno atraso
      setTimeout(() => navigate('/dashboard'), 100);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando anamneses...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <AnamnesisErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnamnesisDataForm
              onComplete={handleFormComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </AnamnesisErrorBoundary>
    );
  }

  if (showUpload) {
    return (
      <AnamnesisErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnamnesisUpload
              onComplete={handleUploadComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </AnamnesisErrorBoundary>
    );
  }

  return (
    <AnamnesisErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleNavigateToDashboard}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Anamneses
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Gerencie os dados de anamneses dos pacientes por área
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUploadAnamnesis} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF/Planilha
                </Button>
                <Button onClick={handleNewAnamnesis}>
                  <FileText className="h-4 w-4 mr-2" />
                  Nova Anamnese
                </Button>
              </div>
            </div>
          </div>

          <AnamnesisDataList />
        </div>
      </div>
    </AnamnesisErrorBoundary>
  );
};

export default AnamnesisDataManager;
