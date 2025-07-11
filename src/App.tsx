import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { ClinicProvider } from '@/contexts/ClinicContext';
// import { AdminProvider } from '@/contexts/AdminProvider';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import MainLayout from '@/components/layout/MainLayout';
import { useEffect } from 'react';
import TabStateSync from '@/components/TabStateSync';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AdminLogin from '@/pages/AdminLogin';
// import AdminPanel from '@/pages/AdminPanel';
import Dashboard from '@/pages/Dashboard';
import AvaliacaoIA from '@/pages/AvaliacaoIA';
import ProtocolosPersonalizados from '@/pages/ProtocolosPersonalizados';
import Patients from '@/pages/Patients';
import ConfiguracaoClinicaPage from '@/pages/ConfiguracaoClinica';
import ConfiguracaoProfissional from '@/pages/ConfiguracaoProfissional';
import CentralRecursos from '@/pages/CentralRecursos';
import EstatisticasClinica from '@/pages/EstatisticasClinica';
import ChatIA from '@/pages/ChatIA';
import GaleriaFotosPage from '@/pages/GaleriaFotos';
import AssinaturasPage from '@/pages/Assinaturas';
import AnamnesisDataManager from '@/components/anamnesis/AnamnesisDataManager';
import ProfessionalLogin from '@/components/auth/ProfessionalLogin';
import AnamnesisDataForm from '@/components/anamnesis/AnamnesisDataForm';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import FormPreservationTest from '@/components/avaliacao-ia/FormPreservationTest';

const queryClient = new QueryClient();

const AnamnesisFormWrapper = () => {
  const navigate = useNavigate();
  const handleNavigateBack = () => navigate(-1);
  return <AnamnesisDataForm onCancel={handleNavigateBack} onComplete={handleNavigateBack} />;
};

// Componente para prevenir recarregamento ao alternar entre abas
const PageVisibilityManager = ({ children }: { children: React.ReactNode }) => {
  const { isVisible } = usePageVisibility();
  
  useEffect(() => {
    // Previne o comportamento padrão de recarregamento
    const preventReload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    
    // Adicionar o event listener independentemente do estado de visibilidade
    window.addEventListener('beforeunload', preventReload);
    
    // Adicionar evento para prevenir recarregamento ao trocar de abas
    const preventUnload = () => {
      // Isso ajuda a prevenir o recarregamento em alguns navegadores
      document.body.style.visibility = 'hidden';
      setTimeout(() => {
        document.body.style.visibility = 'visible';
      }, 0);
    };
    
    document.addEventListener('visibilitychange', preventUnload);
    
    // Remove os event listeners quando o componente é desmontado
    return () => {
      window.removeEventListener('beforeunload', preventReload);
      document.removeEventListener('visibilitychange', preventUnload);
    };
  }, []); // Não depende mais de isVisible
  
  // Quando a visibilidade muda, podemos fazer outras ações se necessário
  useEffect(() => {
    if (isVisible) {
      console.log('[PageVisibilityManager] Página voltou a ter foco');
    } else {
      console.log('[PageVisibilityManager] Página perdeu foco');
    }
  }, [isVisible]);
  
  return <>{children}</>;
};

function App() {
  return (
    <TabStateSync>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Router>
            <PageVisibilityManager>
              <AuthProvider>
                <ClinicProvider>
                  {/* <AdminProvider> */}
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/login-profissional" element={<ProfessionalLogin />} />
                      <Route path="/admin-login" element={<AdminLogin />} />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedAdminRoute>
                            {/* <AdminPanel /> */}
                            <div>Admin em desenvolvimento</div>
                          </ProtectedAdminRoute>
                        } 
                      />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <Dashboard />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/avaliacao-ia" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <AvaliacaoIA />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/avaliacao-ia/*" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <AvaliacaoIA />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/protocolos-personalizados" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <ProtocolosPersonalizados />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/patients" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <Patients />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/configuracao-clinica" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <ConfiguracaoClinicaPage />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/configuracao-profissional" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <ConfiguracaoProfissional />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/central-recursos" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <CentralRecursos />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/estatisticas-clinica" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <EstatisticasClinica />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/chat-ia" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <ChatIA />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/galeria-fotos" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <GaleriaFotosPage />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/anamneses" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <AnamnesisDataManager />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/anamnese/nova" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <AnamnesisFormWrapper />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/anamnese/editar/:id" 
                        element={
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <MainLayout>
                                <AnamnesisFormWrapper />
                              </MainLayout>
                            </SubscriptionGuard>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/assinaturas" 
                        element={
                          <ProtectedRoute>
                            <MainLayout>
                              <AssinaturasPage />
                            </MainLayout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin/assinatura" 
                        element={
                          <ProtectedAdminRoute>
                            <AssinaturasPage />
                          </ProtectedAdminRoute>
                        } 
                      />
                      {/* Rota para teste de preservação de estado entre abas */}
                      <Route 
                        path="/teste-preservacao" 
                        element={
                          <MainLayout>
                            <FormPreservationTest />
                          </MainLayout>
                        } 
                      />
                    </Routes>
                  {/* </AdminProvider> */}
                </ClinicProvider>
              </AuthProvider>
            </PageVisibilityManager>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </TabStateSync>
  );
}

export default App;
