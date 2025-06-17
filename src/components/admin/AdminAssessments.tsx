import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Calendar, User, Brain, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminAssessment {
  id: string;
  patient_name: string;
  patient_age: number;
  assessment_type: string;
  treatment_objective: string;
  main_complaint: string;
  ai_protocol?: string;
  created_at: string;
  clinic: {
    name: string;
  } | null;
  professional_name?: string;
}

const AdminAssessments = () => {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<AdminAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      // Buscar avaliações com clínicas
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          clinic:clinics!assessments_clinic_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (assessmentsError) {
        throw assessmentsError;
      }

      // Buscar profissionais separadamente
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('professionals')
        .select(`
          id,
          user_id
        `);

      if (professionalsError) {
        console.warn('Erro ao buscar profissionais:', professionalsError);
      }

      // Buscar profiles separadamente
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (profilesError) {
        console.warn('Erro ao buscar profiles:', profilesError);
      }

      // Criar mapas para relacionar os dados
      const professionalsMap = new Map();
      const profilesMap = new Map();

      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile.full_name);
        });
      }

      if (professionalsData) {
        professionalsData.forEach(prof => {
          const fullName = profilesMap.get(prof.user_id) || 'Profissional não encontrado';
          professionalsMap.set(prof.id, fullName);
        });
      }

      // Transformar os dados combinando as informações
      const transformedData: AdminAssessment[] = (assessmentsData || []).map(item => ({
        id: item.id,
        patient_name: item.patient_name,
        patient_age: item.patient_age,
        assessment_type: item.assessment_type,
        treatment_objective: item.treatment_objective,
        main_complaint: item.main_complaint,
        ai_protocol: item.ai_protocol || undefined,
        created_at: item.created_at,
        clinic: item.clinic || null,
        professional_name: item.professional_id ? professionalsMap.get(item.professional_id) || 'Profissional não encontrado' : 'Não informado'
      }));

      setAssessments(transformedData);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast({
        title: "Erro ao carregar avaliações",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssessments = () => {
    let filtered = assessments;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.main_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.clinic?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.professional_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(assessment => assessment.assessment_type === filterType);
    }

    // Filtro por período
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filterPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(assessment => 
        new Date(assessment.created_at) >= startDate
      );
    }

    return filtered;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facial': return 'bg-blue-500';
      case 'corporal': return 'bg-green-500';
      case 'capilar': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'facial': return 'Facial';
      case 'corporal': return 'Corporal';
      case 'capilar': return 'Capilar';
      default: return type;
    }
  };

  const filteredAssessments = getFilteredAssessments();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando avaliações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Todas as Avaliações da Plataforma
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize e monitore todas as avaliações geradas na plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros e Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar por paciente, clínica ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="facial">Facial</SelectItem>
                  <SelectItem value="corporal">Corporal</SelectItem>
                  <SelectItem value="capilar">Capilar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredAssessments.length}</p>
              <p className="text-sm text-gray-500">Total Exibido</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredAssessments.filter(a => a.assessment_type === 'facial').length}
              </p>
              <p className="text-sm text-gray-500">Facial</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {filteredAssessments.filter(a => a.assessment_type === 'corporal').length}
              </p>
              <p className="text-sm text-gray-500">Corporal</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredAssessments.filter(a => a.assessment_type === 'capilar').length}
              </p>
              <p className="text-sm text-gray-500">Capilar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de avaliações */}
      {filteredAssessments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              Nenhuma avaliação encontrada
            </p>
            <p className="text-gray-400">
              Tente ajustar os filtros de busca
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {assessment.patient_name}
                      </h4>
                      <Badge variant="secondary" className={`text-white ${getTypeColor(assessment.assessment_type)}`}>
                        {getTypeBadge(assessment.assessment_type)}
                      </Badge>
                      {assessment.ai_protocol && (
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          <Brain className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Idade: {assessment.patient_age} anos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(assessment.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>{assessment.clinic?.name || 'Clínica não informada'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{assessment.professional_name}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Objetivo:</strong> {assessment.treatment_objective}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Queixa:</strong> {assessment.main_complaint}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAssessments;
