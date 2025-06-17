import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PatientAnamnesisData, Patient, AnamnesisFilters } from '@/types/anamnesis';
import { Search, Eye, FileText, User, Calendar, Filter, Download, Edit, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AnamnesisDisplay from './AnamnesisDisplay';

const AnamnesisDataList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [anamnesisData, setAnamnesisData] = useState<PatientAnamnesisData[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnamnesisFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<PatientAnamnesisData | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  }, [user]);

  const fetchAnamnesisData = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('anamnesis_data')
        .select(`
          *,
          patient:patients(id, full_name),
          professional:professionals(id, user_id)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }
      if (filters.anamnesis_type) {
        query = query.eq('anamnesis_type', filters.anamnesis_type);
      }
      if (filters.professional_id) {
        query = query.eq('professional_id', filters.professional_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAnamnesisData((data as PatientAnamnesisData[]) || []);
    } catch (error) {
      console.error('Erro ao buscar dados de anamnese:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de anamnese",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters, toast]);

  useEffect(() => {
    console.log('[AnamnesisDataList] User object:', user);
    if (user) {
      fetchPatients();
      fetchAnamnesisData();
    } else {
      console.log('[AnamnesisDataList] User is null, not fetching data.');
      setLoading(false); // Garante que o loading pare se não houver usuário
      setAnamnesisData([]); // Limpa dados anteriores se o usuário deslogar
    }
  }, [user, filters, fetchPatients, fetchAnamnesisData]);

  const filteredData = anamnesisData.filter(item =>
    item.patient?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'corporal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'capilar':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTypeName = (type: string) => {
    switch (type) {
      case 'facial':
        return 'Facial';
      case 'corporal':
        return 'Corporal';
      case 'capilar':
        return 'Capilar';
      default:
        return 'Geral';
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleViewData = (item: PatientAnamnesisData) => {
    console.log('[AnamnesisDataList] handleViewData called with item:', item);
    if (!item || !item.patient) {
      console.error('[AnamnesisDataList] Tentativa de visualizar dados inválidos ou incompletos:', item);
      toast({
        title: "Erro ao visualizar",
        description: "Dados do paciente ou anamnese estão incompletos.",
        variant: "destructive"
      });
      return;
    }
    // Criar uma visualização mais organizada dos dados
    const formattedData = `
DADOS DA ANAMNESE - ${item.patient?.full_name}

INFORMAÇÕES GERAIS:
• Paciente: ${item.patient?.full_name}
• Tipo de Avaliação: ${formatTypeName(item.anamnesis_type)}
• Data de Criação: ${formatDate(item.created_at)}

HISTÓRICO DE SAÚDE GERAL:
${item.general_health ? JSON.stringify(item.general_health, null, 2) : 'Não informado'}

ESTILO DE VIDA:
${item.lifestyle ? JSON.stringify(item.lifestyle, null, 2) : 'Não informado'}

${item.anamnesis_type === 'facial' ? `AVALIAÇÃO FACIAL:
${item.facial_assessment ? JSON.stringify(item.facial_assessment, null, 2) : 'Não informado'}` : ''}

${item.anamnesis_type === 'corporal' ? `AVALIAÇÃO CORPORAL:
${item.body_assessment ? JSON.stringify(item.body_assessment, null, 2) : 'Não informado'}

MEDIDAS CORPORAIS:
${item.body_measurements ? JSON.stringify(item.body_measurements, null, 2) : 'Não informado'}` : ''}

${item.anamnesis_type === 'capilar' ? `AVALIAÇÃO CAPILAR:
${item.hair_assessment ? JSON.stringify(item.hair_assessment, null, 2) : 'Não informado'}` : ''}
    `;

    // Criar uma janela popup para mostrar os dados formatados
    const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Dados da Anamnese - ${item.patient?.full_name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                background-color: #f5f5f5;
              }
              .container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 800px;
                margin: 0 auto;
              }
              h1 { 
                color: #333; 
                border-bottom: 3px solid #007bff;
                padding-bottom: 10px;
              }
              .section { 
                margin-bottom: 25px; 
                padding: 15px; 
                border-left: 4px solid #007bff;
                background-color: #f8f9fa;
              }
              .section h3 { 
                margin-top: 0; 
                color: #007bff;
                font-size: 18px;
              }
              pre { 
                background: #ffffff; 
                padding: 15px; 
                border-radius: 5px; 
                overflow-x: auto;
                border: 1px solid #e9ecef;
                font-size: 14px;
              }
              .info-item {
                margin-bottom: 8px;
                color: #495057;
              }
              .info-item strong {
                color: #212529;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📋 Dados da Anamnese</h1>
              <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${formattedData}</pre>
            </div>
          </body>
        </html>
      `);
    }
  };

  const handleEdit = (item: PatientAnamnesisData) => {
    navigate(`/anamnese/editar/${item.id}`);
  };

  const handleClone = (item: PatientAnamnesisData) => {
    navigate(`/anamnese/nova?cloneId=${item.id}`);
  };

  const handleDelete = async (item: PatientAnamnesisData) => {
    if (!window.confirm(`Tem certeza que deseja excluir a anamnese de ${item.patient?.full_name}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('anamnesis_data')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      toast({
        title: 'Anamnese excluída',
        description: 'A anamnese foi removida com sucesso.',
      });
      // Atualizar lista
      setAnamnesisData(prev => prev.filter(a => a.id !== item.id));
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a anamnese.',
        variant: 'destructive'
      });
    }
  };

  const handleSendToIA = (anamnesis: PatientAnamnesisData) => {
    // Aqui você pode implementar a chamada para a IA, exibir feedback, etc.
    toast({
      title: 'Enviado para IA',
      description: 'Os dados da anamnese foram enviados para a Avaliação IA.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select 
              value={filters.patient_id || "all"} 
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                patient_id: value === "all" ? undefined : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pacientes</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.anamnesis_type || "all"} 
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                anamnesis_type: value === "all" ? undefined : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                <SelectItem value="facial">Facial</SelectItem>
                <SelectItem value="corporal">Corporal</SelectItem>
                <SelectItem value="capilar">Capilar</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Dados de Anamneses
        </h2>
        <Badge variant="outline">
          {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || Object.keys(filters).length > 0 ? 'Nenhum registro encontrado' : 'Nenhum dado de anamnese cadastrado'}
            </h3>
            <p className="text-gray-500 text-center">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando os dados de anamneses dos seus pacientes'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>{item.patient?.full_name}</span>
                    </CardTitle>
                    <Badge className={getTypeColor(item.anamnesis_type)}>
                      {formatTypeName(item.anamnesis_type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Criado em {formatDate(item.created_at)}</span>
                </div>

                {item.pdf_url && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Arquivo anexado
                  </div>
                )}

                <div className="pt-2 border-t space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedAnamnesis(item)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Dados
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleClone(item)}>
                      <Copy className="h-4 w-4 mr-1" /> Clonar
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </div>
                  {item.pdf_url && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedAnamnesis && (
        <Dialog open={!!selectedAnamnesis} onOpenChange={() => setSelectedAnamnesis(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Anamnese</DialogTitle>
              <DialogDescription>
                Visualização detalhada da anamnese de {selectedAnamnesis.patient?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <AnamnesisDisplay anamnesis={selectedAnamnesis} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setSelectedAnamnesis(null)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AnamnesisDataList;
