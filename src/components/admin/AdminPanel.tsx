
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Users, Building2, FileText, Settings, MessageSquare } from 'lucide-react';
import AdminStats from './AdminStats';
import AdminAssessments from './AdminAssessments';
import AdminPromptIA from './AdminPromptIA';
import AdminSettings from './AdminSettings';

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Painel Administrativo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Visão completa da plataforma Cliniks IA
          </p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <BarChart className="h-4 w-4" />
              <span>Estatísticas</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Avaliações</span>
            </TabsTrigger>
            <TabsTrigger value="prompt-ia" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Prompt IA</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <AdminStats />
          </TabsContent>

          <TabsContent value="assessments">
            <AdminAssessments />
          </TabsContent>

          <TabsContent value="prompt-ia">
            <AdminPromptIA />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
