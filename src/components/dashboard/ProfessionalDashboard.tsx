import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/authContext';
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
import ClinicStats from './ClinicStats';
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
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do profissional:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      fetchProfessionalData();
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Aplicar cores da clínica se disponível
  const clinicColors = clinic?.brand_colors || {};
  const primaryColor = clinicColors.primary || '#7f00fa';
  const secondaryColor = clinicColors.secondary || '#fb0082';
  const textColor = clinicColors.text || '#424242';
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
    <div className="min-h-screen bg-[#424242]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas da Clínica - Agora usando o componente centralizado */}
        <div className="mb-8">
          <ClinicStats />
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
