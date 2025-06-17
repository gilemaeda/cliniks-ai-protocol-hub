
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientsManager from '@/components/patients/PatientsManager';

const Patients = () => {
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
                  Gestão de Pacientes
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Gerencie o cadastro e informações dos seus pacientes
                </p>
              </div>
            </div>
          </div>
        </div>

        <PatientsManager />
      </div>
    </div>
  );
};

export default Patients;
