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
import AnamnesisDataManager from '@/components/anamnesis/AnamnesisDataManager';
import ProfessionalLogin from '@/components/auth/ProfessionalLogin';
import AnamnesisDataForm from '@/components/anamnesis/AnamnesisDataForm';

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
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/avaliacao-ia" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AvaliacaoIA />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/avaliacao-ia/*" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AvaliacaoIA />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/protocolos-personalizados" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProtocolosPersonalizados />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patients" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Patients />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracao-clinica" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConfiguracaoClinicaPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracao-profissional" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConfiguracaoProfissional />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/central-recursos" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CentralRecursos />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/estatisticas-clinica" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EstatisticasClinica />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat-ia" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ChatIA />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/galeria-fotos" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <GaleriaFotosPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/anamneses" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AnamnesisDataManager />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/anamnese/nova" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AnamnesisFormWrapper />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/anamnese/editar/:id" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AnamnesisFormWrapper />
                    </MainLayout>
                  </ProtectedRoute>
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
