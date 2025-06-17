
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, FileText, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalClinics: 0,
    totalUsers: 0,
    totalAssessments: 0,
    totalProfessionals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Buscar total de clínicas
      const { count: clinicsCount } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true });

      // Buscar total de usuários (profiles)
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Buscar total de avaliações
      const { count: assessmentsCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      // Buscar total de profissionais
      const { count: professionalsCount } = await supabase
        .from('professionals')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalClinics: clinicsCount || 0,
        totalUsers: usersCount || 0,
        totalAssessments: assessmentsCount || 0,
        totalProfessionals: professionalsCount || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Clínicas',
      value: stats.totalClinics,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Total de Avaliações',
      value: stats.totalAssessments,
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      title: 'Total de Profissionais',
      value: stats.totalProfessionals,
      icon: BarChart3,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminStats;
