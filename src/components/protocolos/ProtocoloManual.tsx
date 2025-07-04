import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClinicResource {
  id: string;
  name: string;
  resource_type: 'equipment' | 'cosmetic' | 'injectable';
}

interface ProtocolStep {
  id: number;
  title: string;
  description: string;
  duration: string;
}

// Definindo um tipo mais específico para o protocolo
interface ProtocolData {
  name: string;
  description: string;
  content: string;
  therapeutic_objective: string;
  target_audience: string;
  duration_weeks: number | null;
  area?: string;
  protocol_theme?: string;
  clinic_id?: string;
  created_by?: string;
}

interface ProtocoloManualProps {
  onProtocolCreated: (protocol: Partial<ProtocolData>) => void;
}

const ProtocoloManual = ({ onProtocolCreated }: ProtocoloManualProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Dados do protocolo
  const [protocolName, setProtocolName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [duration, setDuration] = useState('');
  const [area, setArea] = useState('');
  const [objectives, setObjectives] = useState('');
  const [procedures, setProcedures] = useState('');
  const [materials, setMaterials] = useState('');
  const [observations, setObservations] = useState('');
  const [resourceSource, setResourceSource] = useState('manual'); // 'manual' or 'central'
  const [clinicResources, setClinicResources] = useState<ClinicResource[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isFetchingResources, setIsFetchingResources] = useState(false);

  useEffect(() => {
    const fetchClinicData = async () => {
      if (user?.id) {
        setIsFetchingResources(true);
        try {
          // Acessa a função RPC para obter o clinic_id do usuário logado
          const { data: clinicData, error: rpcError } = await supabase
            .rpc('get_user_clinic_data', { user_uuid: user.id });

          if (rpcError || !clinicData || clinicData.length === 0) {
            throw new Error(rpcError?.message || 'Dados da clínica não encontrados para buscar recursos.');
          }
          
          const currentClinicId = clinicData[0].clinic_id;
          setClinicId(currentClinicId);

          if (!currentClinicId) {
            throw new Error('ID da clínica não retornado pela função RPC.');
          }

          if (resourceSource === 'central') {
            const { data, error } = await supabase
              .from('clinic_resources')
              .select('id, name, resource_type')
              .eq('clinic_id', currentClinicId);
  
            if (error) {
              throw error;
            }
  
            setClinicResources(data || []);
          } else {
            setClinicResources([]);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar os recursos da clínica.';
          toast({
            title: 'Erro ao buscar recursos',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          setIsFetchingResources(false);
        }
      }
    };

    fetchClinicData();
  }, [resourceSource, user?.id, toast]);

  const handleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const extractCreativeNameAndCleanContent = (content: string): { name: string | null; cleanedContent: string } => {
    // Regex mais flexível para capturar o nome, com ou sem markdown de negrito.
    const nameRegex = /(?:###\s*)?(?:\*\*)?Nome do Protocolo:(?:\*\*)?\s*([^\r\n]+)/i;
    const match = content.match(nameRegex);
    
    let name: string | null = null;
    let cleanedContent = content;

    if (match && match[1]) {
      // Remove possíveis markdown e espaços extras do nome capturado.
      name = match[1].replace(/\*/g, '').trim();
      // Remove a linha inteira do nome do protocolo do conteúdo.
      cleanedContent = content.replace(nameRegex, '').replace(/^\s*[\r\n]/gm, '');
    }
    
    return { name, cleanedContent };
  };

  const handleSubmit = async () => {
    if (!protocolName.trim() || !objectives.trim()) {
      toast({ title: "Campos Obrigatórios", description: "Nome do Protocolo e Objetivos Terapêuticos são obrigatórios.", variant: "destructive" });
      return;
    }

    if (!clinicId) {
      toast({
        title: 'Erro de Inicialização',
        description: 'A identificação da clínica ainda não foi carregada. Por favor, aguarde alguns segundos e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const finalMaterials = resourceSource === 'manual' ? materials : clinicResources
        .filter(r => selectedResources.includes(r.id))
        .map(r => r.name)
        .join(', ');

      const promptData = {
        protocolName, description, targetAudience,
        duration: duration ? `${duration} semanas` : 'Não especificada',
        area, objectives, procedures, materials: finalMaterials, observations,
      };

      const { data: generatedData, error: generationError } = await supabase.functions.invoke('generate-protocol', { body: promptData });

      if (generationError) throw new Error(`Erro ao invocar a função: ${generationError.message}`);
      if (generatedData.error) throw new Error(`Erro retornado pela IA: ${generatedData.error}`);
      if (!generatedData?.generatedContent) throw new Error('A IA não retornou o conteúdo do protocolo ou a resposta tem um formato inválido.');

      const generatedProtocolContent = generatedData.generatedContent;
      
      const { name: creativeName, cleanedContent } = extractCreativeNameAndCleanContent(generatedProtocolContent);

      const newProtocol: Partial<ProtocolData> = {
        name: creativeName || protocolName, // Usa o nome da IA, com fallback para o nome manual
        description: description,
        content: cleanedContent, // Usa o conteúdo limpo, sem a linha do nome
        therapeutic_objective: objectives,
        target_audience: targetAudience,
        duration_weeks: duration ? parseInt(duration) : null,
        area,
        protocol_theme: procedures,
        clinic_id: clinicId,
        created_by: user?.id
      };

      toast({ title: "Protocolo gerado com sucesso!", description: "O protocolo foi criado e está pronto para edição." });
      onProtocolCreated(newProtocol);

      // Reset form
      setProtocolName(''); setDescription(''); setTargetAudience(''); setDuration(''); setArea('');
      setObjectives(''); setProcedures(''); setMaterials(''); setObservations('');
      setSelectedResources([]); setResourceSource('manual');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      toast({ title: "Erro ao Gerar Protocolo", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Criar Protocolo Manual
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Desenvolva seus próprios protocolos personalizados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="protocol_name">Nome do Protocolo *</Label>
              <Input
                id="protocol_name"
                value={protocolName}
                onChange={(e) => setProtocolName(e.target.value)}
                placeholder="Ex: Protocolo Anti-idade Avançado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva brevemente o protocolo..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Público-alvo</Label>
              <Input
                id="target_audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Mulheres de 30-50 anos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (semanas)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 8"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área de Aplicação</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facial">Facial</SelectItem>
                  <SelectItem value="corporal">Corporal</SelectItem>
                  <SelectItem value="capilar">Capilar</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Protocolo */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Protocolo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objectives">Objetivos Terapêuticos *</Label>
              <Textarea
                id="objectives"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Descreva os objetivos do protocolo..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedures">Procedimentos</Label>
              <Textarea
                id="procedures"
                value={procedures}
                onChange={(e) => setProcedures(e.target.value)}
                placeholder="Liste os procedimentos principais..."
                rows={3}
              />
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <Label className="text-base font-semibold">Materiais e Equipamentos *</Label>
              <RadioGroup value={resourceSource} onValueChange={setResourceSource} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Digitar Manualmente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="central" id="central" />
                  <Label htmlFor="central">Buscar da Central de Recursos</Label>
                </div>
              </RadioGroup>

              {resourceSource === 'manual' ? (
                <Textarea
                  id="materials"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="Liste os materiais e equipamentos necessários..."
                  rows={4}
                />
              ) : (
                <div className="space-y-4 pt-2">
                  {isFetchingResources ? (
                    <p>Buscando recursos...</p>
                  ) : clinicResources.length > 0 ? (
                    ['equipment', 'cosmetic', 'injectable'].map(type => {
                      const resourcesOfType = clinicResources.filter(r => r.resource_type === type);
                      if (resourcesOfType.length === 0) return null;
                      return (
                        <div key={type}>
                          <h4 className="font-medium capitalize mb-2">{type === 'equipment' ? 'Equipamentos' : (type === 'cosmetic' ? 'Cosméticos' : 'Injetáveis')}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-md border">
                            {resourcesOfType.map(resource => (
                              <div key={resource.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={resource.id}
                                  checked={selectedResources.includes(resource.id)}
                                  onCheckedChange={() => handleResourceSelection(resource.id)}
                                />
                                <Label htmlFor={resource.id} className="font-normal text-sm">{resource.name}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum recurso encontrado na sua central.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações Gerais</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Cuidados especiais, contraindicações, dicas importantes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Criar Protocolo */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Criando Protocolo...' : 'Criar Protocolo'}
        </Button>
      </div>
    </div>
  );
};

export default ProtocoloManual;
