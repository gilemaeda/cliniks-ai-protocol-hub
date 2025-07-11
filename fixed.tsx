import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, User, HeartPulse, Smile, PersonStanding, Feather } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Patient {
  id: string;
  full_name: string;
}

interface AnamnesisDataFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

const AnamnesisDataForm = ({ onComplete, onCancel }: AnamnesisDataFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formData, setFormData] = useState({
    // Dados básicos
    main_complaint: '',
    observations: ''
  });

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar dados da clínica do usuário
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) {
        return;
      }

      const clinic = clinicData[0];

      // Buscar pacientes da clínica
      const { data: patientsData, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinic.clinic_id)
        .order('full_name');

      if (error) throw error;
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para salvar
      const anamnesisData = {
        patient_id: selectedPatientId,
        professional_id: user?.id,
        anamnesis_type: 'general',
        main_complaint: formData.main_complaint,
        general_data: {},
        lifestyle: {},
        facial_assessment: {},
        body_assessment: {},
        hair_assessment: {},
        created_at: new Date().toISOString(),
        observations: formData.observations
      };

      // Salvar no Supabase
      const { error } = await supabase
        .from('anamnesis')
        .insert([anamnesisData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Anamnese salva com sucesso!",
      });

      onComplete();
    } catch (error: any) {
      console.error('Erro ao salvar anamnese:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar anamnese",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Nova Anamnese</h2>
        <div></div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Dados da Anamnese</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente*</Label>
              <Select
                value={selectedPatientId}
                onValueChange={setSelectedPatientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Selecione o paciente para o qual esta anamnese será criada.
              </p>
            </div>
            
            <Tabs defaultValue="general_data" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general_data"><HeartPulse className="h-4 w-4 mr-2" />Dados Gerais</TabsTrigger>
                <TabsTrigger value="lifestyle"><Smile className="h-4 w-4 mr-2" />Estilo de Vida</TabsTrigger>
                <TabsTrigger value="facial_assessment"><Smile className="h-4 w-4 mr-2" />Facial</TabsTrigger>
                <TabsTrigger value="body_assessment"><PersonStanding className="h-4 w-4 mr-2" />Corporal</TabsTrigger>
                <TabsTrigger value="hair_assessment"><Feather className="h-4 w-4 mr-2" />Capilar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general_data">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Saúde Geral</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conteúdo de dados gerais aqui */}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="lifestyle">
                <Card>
                  <CardHeader>
                    <CardTitle>Estilo de Vida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conteúdo de estilo de vida aqui */}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="facial_assessment">
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliação Facial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conteúdo de avaliação facial aqui */}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="body_assessment">
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliação Corporal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conteúdo de avaliação corporal aqui */}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="hair_assessment">
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliação Capilar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conteúdo de avaliação capilar aqui */}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2 pt-4">
              <Label>Queixa Principal</Label>
              <Textarea
                value={formData.main_complaint}
                onChange={(e) => handleInputChange('main_complaint', e.target.value)}
                placeholder="Descreva a queixa principal do paciente"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Observações Adicionais</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Observações adicionais sobre o paciente"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !selectedPatientId}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Anamnese'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnamnesisDataForm;
