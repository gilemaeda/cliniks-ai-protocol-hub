
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PatientAnamnesisData } from '@/types/anamnesis';
import { Search, Eye, FileText, User, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AnamnesisDisplay from './AnamnesisDisplay';

const AnamnesisHistory = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [anamnesis, setAnamnesis] = useState<PatientAnamnesisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<PatientAnamnesisData | null>(null);

  const fetchAnamnesis = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('anamnesis_data')
        .select(`
          *,
          patient:patients(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Converter os dados do Supabase para nosso tipo com casting seguro
      const convertedAnamnesis: PatientAnamnesisData[] = (data || []).map(item => ({
        ...item,
        anamnesis_type: item.anamnesis_type as 'facial' | 'corporal' | 'capilar' | 'geral',
        data: typeof item.data === 'object' && item.data !== null ? item.data as Record<string, any> : {},
        general_health: typeof item.general_health === 'object' && item.general_health !== null ? item.general_health as Record<string, any> : {},
        lifestyle: typeof item.lifestyle === 'object' && item.lifestyle !== null ? item.lifestyle as Record<string, any> : {},
        facial_assessment: typeof item.facial_assessment === 'object' && item.facial_assessment !== null ? item.facial_assessment as Record<string, any> : {},
        body_assessment: typeof item.body_assessment === 'object' && item.body_assessment !== null ? item.body_assessment as Record<string, any> : {},
        body_measurements: typeof item.body_measurements === 'object' && item.body_measurements !== null ? item.body_measurements as Record<string, any> : {},
        hair_assessment: typeof item.hair_assessment === 'object' && item.hair_assessment !== null ? item.hair_assessment as Record<string, any> : {}
      }));

      setAnamnesis(convertedAnamnesis);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de anamnese",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnamnesis();
  }, [user]);

  const filteredAnamnesis = anamnesis.filter(item =>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Histórico de Anamnese
        </h2>
        <Badge variant="outline">
          {filteredAnamnesis.length} registro{filteredAnamnesis.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por paciente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Anamnesis List */}
      {filteredAnamnesis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Nenhum registro encontrado' : 'Nenhuma anamnese realizada'}
            </h3>
            <p className="text-gray-500 text-center">
              {searchTerm 
                ? 'Tente usar outros termos de busca'
                : 'Realize sua primeira anamnese usando os formulários disponíveis'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnamnesis.map((item) => (
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
                  <span>Realizada em {formatDate(item.created_at)}</span>
                </div>

                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedAnamnesis(item)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Respostas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedAnamnesis && (
        <Dialog open={!!selectedAnamnesis} onOpenChange={() => setSelectedAnamnesis(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Anamnese</DialogTitle>
              <DialogDescription>
                Visualização detalhada da anamnese de {selectedAnamnesis.patient?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <AnamnesisDisplay anamnesis={selectedAnamnesis} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AnamnesisHistory;
