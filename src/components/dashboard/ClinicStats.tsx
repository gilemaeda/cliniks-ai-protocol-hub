import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { Users, FileText, Camera, Wrench, Brain, Building2 } from 'lucide-react';

interface ClinicStatistics {
  assessments: number;
  professionals: number;
  patients: number;
  photos: number;
  protocols: number;
  resources: number;
}

const ClinicStats = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<ClinicStatistics>({
    assessments: 0,
    professionals: 0,
    patients: 0,
    photos: 0,
    protocols: 0,
    resources: 0
  });
  const [loading, setLoading] = useState(true);

  // Efeito para buscar estatísticas quando o perfil do usuário estiver disponível
  useEffect(() => {
    if (profile) {
      fetchStatistics();
    }
  }, [profile]); // Executar quando o perfil mudar

  const fetchStatistics = async () => {
    if (!user || !profile || !profile.clinic_id) {
      console.warn('ClinicStats: Usuário, perfil ou ID da clínica não disponível para buscar estatísticas.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('ClinicStats: Iniciando busca de estatísticas para a clínica:', profile.clinic_id);

      // A função obtém o clinic_id do usuário autenticado no backend
      const { data, error } = await supabase.rpc('get_clinic_statistics');

      console.log('ClinicStats: Resposta da função RPC:', { data, error });

      if (error) {
        console.error('ClinicStats: Erro ao chamar função get_clinic_statistics:', error);
        // Opcional: Adicionar um toast de erro para o usuário
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.log('ClinicStats: Dados recebidos com sucesso:', data);
        setStats(data as any);
      } else {
        console.warn('ClinicStats: A função RPC não retornou dados.');
      }
    } catch (error) {
      console.error('ClinicStats: Erro inesperado ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Avaliações',
      value: stats.assessments,
      icon: Brain,
      color: 'text-blue-600',
      description: 'Avaliações realizadas'
    },
    {
      title: 'Profissionais',
      value: stats.professionals,
      icon: Users,
      color: 'text-green-600',
      description: 'Profissionais ativos'
    },
    {
      title: 'Pacientes',
      value: stats.patients,
      icon: Building2,
      color: 'text-purple-600',
      description: 'Pacientes cadastrados'
    },
    {
      title: 'Fotos',
      value: stats.photos,
      icon: Camera,
      color: 'text-orange-600',
      description: 'Fotos no sistema'
    },
    {
      title: 'Protocolos',
      value: stats.protocols,
      icon: FileText,
      color: 'text-red-600',
      description: 'Protocolos criados'
    },
    {
      title: 'Recursos',
      value: stats.resources,
      icon: Wrench,
      color: 'text-indigo-600',
      description: 'Equipamentos e produtos'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClinicStats;
