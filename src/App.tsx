import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { ClinicProvider } from '@/contexts/ClinicContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import MainLayout from '@/components/layout/MainLayout';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AdminLogin from '@/pages/AdminLogin';
import AdminPanel from '@/pages/AdminPanel';
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

const queryClient = new QueryClient();

const AnamnesisFormWrapper = () => {
  const navigate = useNavigate();
  const handleNavigateBack = () => navigate(-1);
  return <AnamnesisDataForm onCancel={handleNavigateBack} onComplete={handleNavigateBack} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <ClinicProvider>
            <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login-profissional" element={<ProfessionalLogin />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedAdminRoute>
                    <AdminPanel />
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
            </Routes>
            </Router>
          </ClinicProvider>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
