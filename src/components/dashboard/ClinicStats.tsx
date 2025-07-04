
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { Users, FileText, Camera, Wrench, Brain, Building2 } from 'lucide-react';

interface ClinicStatistics {
  total_assessments: number;
  total_professionals: number;
  total_patients: number;
  total_photos: number;
  total_protocols: number;
  total_resources: number;
}

const ClinicStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ClinicStatistics>({
    total_assessments: 0,
    total_professionals: 0,
    total_patients: 0,
    total_photos: 0,
    total_protocols: 0,
    total_resources: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_clinic_statistics');

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Avaliações',
      value: stats.total_assessments,
      icon: Brain,
      color: 'text-blue-600',
      description: 'Avaliações realizadas'
    },
    {
      title: 'Profissionais',
      value: stats.total_professionals,
      icon: Users,
      color: 'text-green-600',
      description: 'Profissionais ativos'
    },
    {
      title: 'Pacientes',
      value: stats.total_patients,
      icon: Building2,
      color: 'text-purple-600',
      description: 'Pacientes cadastrados'
    },
    {
      title: 'Fotos',
      value: stats.total_photos,
      icon: Camera,
      color: 'text-orange-600',
      description: 'Fotos no sistema'
    },
    {
      title: 'Protocolos',
      value: stats.total_protocols,
      icon: FileText,
      color: 'text-red-600',
      description: 'Protocolos criados'
    },
    {
      title: 'Recursos',
      value: stats.total_resources,
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
