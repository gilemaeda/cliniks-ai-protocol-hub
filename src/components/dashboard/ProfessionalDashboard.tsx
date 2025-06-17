import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import MainTools from '@/components/dashboard/MainTools';
import { FileText, Users, Camera, Calendar, Settings, Brain } from 'lucide-react';

const ProfessionalDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [stats, setStats] = useState({
    assessments: 0,
    patients: 0,
    photos: 0,
    protocols: 0
  });

  useEffect(() => {
    if (user && profile?.role === 'professional') {
      fetchProfessionalData();
    }
  }, [user, profile]);

  const fetchProfessionalData = async () => {
    if (!user) return;

    try {
      // Buscar dados do profissional e clínica
      const { data, error } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (error) {
        console.error('Erro ao buscar dados:', error);
        return;
      }

      if (data && data.length > 0) {
        const userData = data[0];
        
        // Buscar dados completos da clínica
        if (userData.clinic_id) {
          const { data: clinicData } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', userData.clinic_id)
            .single();
          
          if (clinicData) {
            setClinic(clinicData);
          }
        }

        // Buscar dados completos do profissional
        if (userData.professional_id) {
          const { data: profData } = await supabase
            .from('professionals')
            .select('*')
            .eq('id', userData.professional_id)
            .single();
          
          if (profData) {
            setProfessional(profData);
          }

          // Buscar estatísticas do profissional
          await fetchProfessionalStats(userData.professional_id, userData.clinic_id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do profissional:', error);
    }
  };

  const fetchProfessionalStats = async (professionalId: string, clinicId: string) => {
    try {
      // Avaliações do profissional
      const { count: assessmentsCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId);

      // Pacientes únicos do profissional
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId);

      // Fotos do profissional
      const { count: photosCount } = await supabase
        .from('patient_photos')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId);

      // Protocolos da clínica (compartilhados)
      const { count: protocolsCount } = await supabase
        .from('custom_protocols')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      setStats({
        assessments: assessmentsCount || 0,
        patients: patientsCount || 0,
        photos: photosCount || 0,
        protocols: protocolsCount || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Aplicar cores da clínica se disponível
  const clinicColors = clinic?.brand_colors || {};
  const primaryColor = clinicColors.primary || '#3b82f6';
  const secondaryColor = clinicColors.secondary || '#8b5cf6';

  // Não renderizar banner aqui! Apenas MainLayout deve exibir o banner.
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assessments}</div>
              <p className="text-xs text-muted-foreground">Avaliações realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.patients}</div>
              <p className="text-xs text-muted-foreground">Pacientes atendidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fotos</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.photos}</div>
              <p className="text-xs text-muted-foreground">Fotos cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protocolos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.protocols}</div>
              <p className="text-xs text-muted-foreground">Protocolos disponíveis</p>
            </CardContent>
          </Card>
        </div>

        {/* Ferramentas principais */}
        <MainTools />
        
        {/* Cards adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/avaliacao-ia')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: primaryColor }}>
                <Brain className="h-5 w-5" />
                <span>Avaliação com IA</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Realize avaliações estéticas com inteligência artificial
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/patients')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: primaryColor }}>
                <Users className="h-5 w-5" />
                <span>Pacientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie o cadastro de pacientes
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/anamneses')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: primaryColor }}>
                <FileText className="h-5 w-5" />
                <span>Anamneses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Coleta e análise de dados de anamnese
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/galeria-fotos')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: secondaryColor }}>
                <Camera className="h-5 w-5" />
                <span>Galeria de Fotos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Antes e depois dos tratamentos
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/protocolos-personalizados')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: secondaryColor }}>
                <Calendar className="h-5 w-5" />
                <span>Protocolos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Protocolos personalizados e IA
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/configuracao-profissional')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: secondaryColor }}>
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Configurações do perfil profissional
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
