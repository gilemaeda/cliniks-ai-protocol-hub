
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Upload, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnamnesisManager from '@/components/anamnesis/AnamnesisManager';
import AnamnesisUpload from '@/components/anamnesis/AnamnesisUpload';
import AnamnesisHistory from '@/components/anamnesis/AnamnesisHistory';

const Anamneses = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'manager' | 'upload' | 'history'>('manager');

  const renderContent = () => {
    switch (activeView) {
      case 'upload':
        return (
          <AnamnesisUpload
            onComplete={() => setActiveView('manager')}
            onCancel={() => setActiveView('manager')}
          />
        );
      case 'history':
        return <AnamnesisHistory />;
      default:
        return <AnamnesisManager />;
    }
  };

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
                  Anamneses
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Gerencie formulários de anamnese e dados dos pacientes
                </p>
              </div>
            </div>

            {activeView === 'manager' && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setActiveView('upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" onClick={() => setActiveView('history')}>
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              </div>
            )}
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default Anamneses;
