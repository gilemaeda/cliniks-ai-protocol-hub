import { useEffect, useState, useCallback } from 'react';
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
import { FileText, Users, Camera, Calendar, Settings, Brain, Lock } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Type definitions for better type safety
interface Clinic {
  id: string;
  name: string;
  brand_colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  banner_url: string;
  plan_status: 'active' | 'inactive' | 'trialing' | 'expired';
}

interface Professional {
  id: string;
  name: string;
}

const ProfessionalDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { canAccess, blockReason, isChecking } = useAccessControl();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [stats, setStats] = useState({
    assessments: 0,
    patients: 0,
    photos: 0,
    protocols: 0
  });

  const fetchProfessionalStats = useCallback(async (professionalId: string, clinicId: string) => {
    try {
      const { count: assessmentsCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId);

      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId);

      const { count: photosCount } = await supabase
        .from('patient_photos')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', professionalId);

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
  }, []);

  const fetchProfessionalData = useCallback(async () => {
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
  }, [user, fetchProfessionalStats]);

  useEffect(() => {
    if (user && profile?.role === 'professional') {
      fetchProfessionalData();
    }
  }, [user, profile, fetchProfessionalData]);



  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Aplicar cores da clínica se disponível
  const clinicColors = clinic?.brand_colors || {};
  const primaryColor = clinicColors.primary || '#3b82f6';
  const secondaryColor = clinicColors.secondary || '#6366f1';
  const textColor = clinicColors.text || '#1f2937';
  const backgroundColor = clinicColors.background || '#f9fafb';
  const bannerUrl = clinic?.banner_url || '/default-banner.jpg';

  const additionalTools = [
    {
      title: 'Avaliação com IA',
      description: 'Realize avaliações estéticas com inteligência artificial',
      icon: Brain,
      onClick: () => navigate('/avaliacao-ia'),
      color: 'primary',
    },
    {
      title: 'Pacientes',
      description: 'Gerencie o cadastro de pacientes',
      icon: Users,
      onClick: () => navigate('/patients'),
      color: 'primary',
    },
    {
      title: 'Anamneses',
      description: 'Coleta e análise de dados de anamnese',
      icon: FileText,
      onClick: () => navigate('/anamneses'),
      color: 'primary',
    },
    {
      title: 'Galeria de Fotos',
      description: 'Antes e depois dos tratamentos',
      icon: Camera,
      onClick: () => navigate('/galeria-fotos'),
      color: 'secondary',
    },
    {
      title: 'Protocolos',
      description: 'Protocolos personalizados e IA',
      icon: Calendar,
      onClick: () => navigate('/protocolos-personalizados'),
      color: 'secondary',
    },
    {
      title: 'Configurações',
      description: 'Configurações do perfil profissional',
      icon: Settings,
      onClick: () => navigate('/configuracao-profissional'),
      color: 'secondary',
    },
  ];

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
          <TooltipProvider>
            {additionalTools.map((tool) => {
              const Icon = tool.icon;
              const isBlocked = !canAccess && !isChecking;

              const cardItself = (
                <div className="relative">
                  <Card
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${isBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={isBlocked ? undefined : tool.onClick}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2" style={{ color: tool.color === 'primary' ? primaryColor : secondaryColor }}>
                        <Icon className="h-5 w-5" />
                        <span>{tool.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">
                        {tool.description}
                      </p>
                    </CardContent>
                  </Card>
                  {isBlocked && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-xl z-10 pointer-events-none">
                      <Lock className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
              );

              if (isBlocked) {
                return (
                  <Tooltip key={tool.title}>
                    <TooltipTrigger asChild>
                      <div>{cardItself}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {blockReason === 'EXPIRED'
                          ? 'O plano da clínica expirou. Peça para o proprietário renovar.'
                          : 'O plano da clínica está inativo. Peça para o proprietário ativar.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div key={tool.title}>
                  {cardItself}
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
