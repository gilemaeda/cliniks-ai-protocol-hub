import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Settings, BarChart3, FileText, CreditCard, Tag, Brain, User, CreditCard as CreditCardIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminStats from '@/components/admin/AdminStats';
import AdminAssessments from '@/components/admin/AdminAssessments';
import AdminPlans from '@/components/admin/AdminPlans';
import AdminCoupons from '@/components/admin/AdminCoupons';
import AdminPromptIA from '@/components/admin/AdminPromptIA';
import AdminChatProtocolPrompt from '@/components/admin/AdminChatProtocolPrompt';
import AdminSettings from '@/components/admin/AdminSettings';
import SubscriptionsManager from '@/components/admin/SubscriptionsManager';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');

  const [adminName, setAdminName] = useState('Administrador Master');

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    try {
      // Buscar informações do admin logado
      const adminAuth = localStorage.getItem('cliniks_admin_auth');
      
      // Verificar se o valor é 'authenticated' (caso especial)
      if (adminAuth === 'authenticated') {
        // Caso especial: usuário está autenticado, mas sem dados específicos
        // Manter o nome padrão e não fazer nada
        console.log('Admin autenticado sem dados específicos');
        return;
      }
      
      if (adminAuth) {
        try {
          // Tentar fazer o parse do JSON
          const adminData = JSON.parse(adminAuth);
          
          if (adminData && adminData.email) {
            const { data, error } = await supabase
              .from('admin_users')
              .select('full_name')
              .eq('email', adminData.email)
              .single();

            if (data && !error) {
              setAdminName(data.full_name || 'Administrador Master');
            }
          }
        } catch (jsonError) {
          console.error('Erro ao analisar dados do admin:', jsonError);
          // Se o valor não for um JSON válido, mas o usuário estiver autenticado de alguma forma,
          // não remover o item do localStorage para não deslogar o usuário
          if (adminAuth !== 'authenticated' && typeof adminAuth !== 'string') {
            localStorage.removeItem('cliniks_admin_auth');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações do admin:', error);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('cliniks_admin_auth');
    
    toast({
      title: "Logout realizado com sucesso!",
      description: "Sessão administrativa encerrada."
    });
    
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl gradient-text">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gestão da Plataforma Cliniks IA Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {adminName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Acesso Total
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Administração da Plataforma
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gerencie todas as funcionalidades e configurações da plataforma
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-500" />
              <span>Painel de Controle Administrativo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-8 w-full mb-6">
                <TabsTrigger value="stats" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Estatísticas</span>
                </TabsTrigger>
                <TabsTrigger value="assessments" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Avaliações</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Planos</span>
                </TabsTrigger>
                <TabsTrigger value="coupons" className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span className="hidden sm:inline">Cupons</span>
                </TabsTrigger>
                <TabsTrigger value="prompt-ia" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Prompt IA</span>
                </TabsTrigger>
                <TabsTrigger value="prompt-chat-protocolo" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-purple-500" /> {/* Ícone diferente para distinguir */} 
                  <span className="hidden sm:inline">Prompt Chat</span>
                </TabsTrigger>
                <TabsTrigger value="assinaturas" className="flex items-center space-x-2">
                  <CreditCardIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Assinaturas</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-6">
                <AdminStats />
              </TabsContent>

              <TabsContent value="assessments" className="mt-6">
                <AdminAssessments />
              </TabsContent>

              <TabsContent value="plans" className="mt-6">
                <AdminPlans />
              </TabsContent>

              <TabsContent value="coupons" className="mt-6">
                <AdminCoupons />
              </TabsContent>

              <TabsContent value="prompt-ia" className="mt-6">
                <AdminPromptIA />
              </TabsContent>

              <TabsContent value="prompt-chat-protocolo" className="mt-6">
                <AdminChatProtocolPrompt />
              </TabsContent>

              <TabsContent value="assinaturas" className="mt-6">
                <SubscriptionsManager />
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <AdminSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
