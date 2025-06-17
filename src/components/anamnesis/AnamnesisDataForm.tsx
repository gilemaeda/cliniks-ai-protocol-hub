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
import AvaliacaoFacial from './forms/AvaliacaoFacial';
import AvaliacaoCorporal from './forms/AvaliacaoCorporal';
import AvaliacaoCapilar from './forms/AvaliacaoCapilar';
import HistoricoSaudeGeral from './forms/HistoricoSaudeGeral';
import EstiloDeVida from './forms/EstiloDeVida';
import MedidasCorporais from './forms/MedidasCorporais';

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
  const [anamnesisType, setAnamnesisType] = useState<'facial' | 'corporal' | 'capilar' | ''>('');
  const [formData, setFormData] = useState({
    // Histórico de Saúde Geral
    has_allergy: '', // 'yes', 'no'
    allergy_details: '',
    continuous_medication: '', // 'yes', 'no'
    continuous_medication_details: '',
    pre_existing_conditions: '', // 'yes', 'no'
    pre_existing_conditions_details: '',
    previous_aesthetic_procedures: '', // 'yes', 'no'
    previous_aesthetic_procedures_details: '',
    pregnant_or_lactating: '', // 'yes', 'no'
    autoimmune_disease: '', // 'yes', 'no'
    keloid_history: '', // 'yes', 'no'
    surgeries: '', // 'yes', 'no'
    surgery_details: '',
    circulatory_problem: '', // 'yes', 'no'
    hormonal_problem: '', // 'yes', 'no'
    fluid_retention_history: '', // 'yes', 'no' // Renomeado para evitar conflito com avaliação corporal
    intestinal_constipation: '', // 'yes', 'no'
    // Estilo de Vida (a ser adicionado na próxima etapa)
    sleep_well: '',
    good_nutrition: '',
    physical_activity: '',
    physical_activity_frequency: '',
    alcohol_consumption: '',
    alcohol_consumption_frequency: '',
    smoker: '',
    smoker_quantity: '',
    stress_anxiety_depression_history: '',
    daily_hydration_liters: '',
    meals_per_day: '',
    // Avaliação Facial (a ser adicionado na próxima etapa)
    facial_thirds_analysis: [],
    facial_proportions: '',
    facial_flaccidity: '',
    facial_volume_loss: '',
    facial_grooves: '',
    facial_static_lines: '',
    facial_asymmetries: '',
    facial_jowl: '',
    facial_expression_lines: '',
    facial_spots: '',
    facial_observations: '',
    // Avaliação Corporal (a ser adicionado na próxima etapa)
    body_areas_bother: '',
    body_biotype: '', // 'androide', 'ginoide', 'misto'
    body_cellulite: '',
    body_flaccidity: '',
    body_localized_fat: '',
    body_stretch_marks: '',
    body_fluid_retention: '',
    body_fibrosis: '',
    body_varicose_veins: '',
    body_complaint_areas: '',
    body_cellulite_grade: '', // 'leve', 'moderada', 'severa'
    body_flaccidity_grade: '', // 'leve', 'moderada', 'severa'
    body_observations: '',
    // Medidas Corporais (a ser adicionado na próxima etapa)
    height_cm: '',
    weight_kg: '',
    imc: '', // Calculado
    circumference_abdomen: '',
    circumference_waist: '',
    circumference_hip: '',
    circumference_thigh_right: '',
    circumference_thigh_left: '',
    circumference_arm_right: '',
    circumference_arm_left: '',
    // Avaliação Capilar (a ser adicionado na próxima etapa)
    hair_main_complaint: '',
    hair_loss_start_period: '',
    hair_loss_pattern: '', // 'continua', 'fases'
    hair_loss_perception: '', // 'falhas', 'afinamento_generalizado'
    hair_loss_daily_average_threads: '',
    hair_breakage_or_root_fall: '', // 'quebra', 'raiz'
    hair_family_history_alopecia: '',
    hair_disease_onset: '', // 'subito', 'progressivo'
    hair_scalp_symptoms_pain: false,
    hair_scalp_symptoms_burning: false,
    hair_scalp_symptoms_itching: false,
    hair_scalp_symptoms_sensitivity: false,
    hair_scalp_symptoms_inflammation: false,
    hair_scalp_secretions: false,
    hair_scalp_scaling_dandruff: false,
    hair_scalp_wounds_crusts: false,
    hair_regrowth_after_fall: '',
    hair_miniaturization_observation: '',
    hair_additional_observations: '',
    // Campos existentes - podem ser removidos ou integrados se fizer sentido
    complaint: '', // Queixa principal geral, pode ser mantida ou integrada
    observations: '' // Observações gerais, pode ser mantida ou integrada
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
  }, [user]); // Adicionado user como dependência do useCallback

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]); // Adicionado fetchPatients como dependência do useEffect

  const oldFetchPatientsPlaceholder = async () => { // Esta função é apenas um placeholder para o TargetContent encontrar o local correto e será substituída pelo corpo real de fetchPatients que está acima.
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
      // Buscar dados da clínica
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user?.id });

      if (!clinicData || clinicData.length === 0) {
        throw new Error('Clínica não encontrada');
      }

      const clinic = clinicData[0];

      const anamnesisData = {
        patient_id: selectedPatientId,
        clinic_id: clinic.clinic_id,
        anamnesis_type: anamnesisType,
        general_health: {
          has_allergy: formData.has_allergy === 'yes',
          allergy_details: formData.has_allergy === 'yes' ? formData.allergy_details : null,
          continuous_medication: formData.continuous_medication === 'yes',
          continuous_medication_details: formData.continuous_medication === 'yes' ? formData.continuous_medication_details : null,
          pre_existing_conditions: formData.pre_existing_conditions === 'yes',
          pre_existing_conditions_details: formData.pre_existing_conditions === 'yes' ? formData.pre_existing_conditions_details : null,
          previous_aesthetic_procedures: formData.previous_aesthetic_procedures === 'yes',
          previous_aesthetic_procedures_details: formData.previous_aesthetic_procedures === 'yes' ? formData.previous_aesthetic_procedures_details : null,
          pregnant_or_lactating: formData.pregnant_or_lactating === 'yes',
          autoimmune_disease: formData.autoimmune_disease === 'yes',
          keloid_history: formData.keloid_history === 'yes',
          surgeries: formData.surgeries === 'yes',
          surgery_details: formData.surgeries === 'yes' ? formData.surgery_details : null,
          circulatory_problem: formData.circulatory_problem === 'yes',
          hormonal_problem: formData.hormonal_problem === 'yes',
          fluid_retention_history: formData.fluid_retention_history === 'yes',
          intestinal_constipation: formData.intestinal_constipation === 'yes',
          // Adicionar outros campos de general_health aqui conforme forem implementados
          complaint: formData.complaint, // Mantendo queixa principal geral por enquanto
        },
        lifestyle: {
          // Adicionar campos de lifestyle aqui conforme forem implementados
        },
        facial_assessment: anamnesisType === 'facial' ? {
          facial_thirds_analysis: formData.facial_thirds_analysis,
          facial_proportions: formData.facial_proportions,
          facial_flaccidity: formData.facial_flaccidity,
          facial_volume_loss: formData.facial_volume_loss,
          facial_grooves: formData.facial_grooves,
          facial_static_lines: formData.facial_static_lines,
          facial_asymmetries: formData.facial_asymmetries,
          facial_jowl: formData.facial_jowl,
          facial_expression_lines: formData.facial_expression_lines,
          facial_spots: formData.facial_spots,
          facial_observations: formData.facial_observations,
        } : {},
        body_assessment: anamnesisType === 'corporal' ? {
          body_areas_bother: formData.body_areas_bother,
          body_biotype: formData.body_biotype,
          body_cellulite: formData.body_cellulite,
          body_flaccidity: formData.body_flaccidity,
          body_localized_fat: formData.body_localized_fat,
          body_stretch_marks: formData.body_stretch_marks,
          body_fluid_retention: formData.body_fluid_retention,
          body_fibrosis: formData.body_fibrosis,
          body_varicose_veins: formData.body_varicose_veins,
          body_complaint_areas: formData.body_complaint_areas,
          body_cellulite_grade: formData.body_cellulite_grade,
          body_flaccidity_grade: formData.body_flaccidity_grade,
          body_observations: formData.body_observations,
        } : {},
        body_measurements: anamnesisType === 'corporal' ? {
          height_cm: formData.height_cm,
          weight_kg: formData.weight_kg,
          imc: formData.imc,
          circumference_abdomen: formData.circumference_abdomen,
          circumference_waist: formData.circumference_waist,
          circumference_hip: formData.circumference_hip,
          circumference_thigh_right: formData.circumference_thigh_right,
          circumference_thigh_left: formData.circumference_thigh_left,
          circumference_arm_right: formData.circumference_arm_right,
          circumference_arm_left: formData.circumference_arm_left,
        } : {},
        hair_assessment: anamnesisType === 'capilar' ? {
          hair_main_complaint: formData.hair_main_complaint,
          hair_loss_start_period: formData.hair_loss_start_period,
          hair_loss_pattern: formData.hair_loss_pattern,
          hair_loss_perception: formData.hair_loss_perception,
          hair_loss_daily_average_threads: formData.hair_loss_daily_average_threads,
          hair_breakage_or_root_fall: formData.hair_breakage_or_root_fall,
          hair_family_history_alopecia: formData.hair_family_history_alopecia,
          hair_disease_onset: formData.hair_disease_onset,
          hair_scalp_symptoms_pain: formData.hair_scalp_symptoms_pain,
          hair_scalp_symptoms_burning: formData.hair_scalp_symptoms_burning,
          hair_scalp_symptoms_itching: formData.hair_scalp_symptoms_itching,
          hair_scalp_symptoms_sensitivity: formData.hair_scalp_symptoms_sensitivity,
          hair_scalp_symptoms_inflammation: formData.hair_scalp_symptoms_inflammation,
          hair_scalp_secretions: formData.hair_scalp_secretions,
          hair_scalp_scaling_dandruff: formData.hair_scalp_scaling_dandruff,
          hair_scalp_wounds_crusts: formData.hair_scalp_wounds_crusts,
          hair_regrowth_after_fall: formData.hair_regrowth_after_fall,
          hair_miniaturization_observation: formData.hair_miniaturization_observation,
          hair_additional_observations: formData.hair_additional_observations,
        } : {},
        created_by: user?.id,
        professional_id: clinic.professional_id
      };

      const { error } = await supabase
        .from('anamnesis_data')
        .insert(anamnesisData);

      if (error) throw error;

      toast({
        title: "Anamnese salva!",
        description: "Os dados da anamnese foram salvos com sucesso"
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a anamnese",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      {/* Passo 1: Seleção do tipo de anamnese */}
      {!anamnesisType && (
        <Card>
          <CardHeader>
            <CardTitle>Selecione o tipo de anamnese *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setAnamnesisType('facial')}><Smile className="mr-2" />Facial</Button>
              <Button variant="outline" onClick={() => setAnamnesisType('corporal')}><PersonStanding className="mr-2" />Corporal</Button>
              <Button variant="outline" onClick={() => setAnamnesisType('capilar')}><Feather className="mr-2" />Capilar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passo 2: Formulário conforme tipo selecionado */}
      {anamnesisType && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Preenchimento da Anamnese</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient-select">Paciente *</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={loading} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patients.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nenhum paciente encontrado. Cadastre pacientes primeiro.
                </p>
              )}
            </div>

            <Tabs defaultValue="general_data" className="w-full">
                <TabsList className={`grid w-full ${anamnesisType === 'facial' ? 'grid-cols-2' : anamnesisType === 'corporal' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                <TabsTrigger value="general_data"><HeartPulse className="h-4 w-4 mr-2" />Dados Gerais</TabsTrigger>
                  {anamnesisType === 'facial' && <TabsTrigger value="facial_assessment"><Smile className="h-4 w-4 mr-2" />Facial</TabsTrigger>}
                  {anamnesisType === 'corporal' && <TabsTrigger value="body_assessment"><PersonStanding className="h-4 w-4 mr-2" />Corporal</TabsTrigger>}
                  {anamnesisType === 'capilar' && <TabsTrigger value="hair_assessment"><Feather className="h-4 w-4 mr-2" />Capilar</TabsTrigger>}
              </TabsList>

              <TabsContent value="general_data">
                <Card>
                  <CardHeader>
                      <CardTitle>Histórico de Saúde Geral <span className="text-red-500">*</span></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <HistoricoSaudeGeral data={formData} onChange={(data) => setFormData({ ...formData, ...data })} obrigatorio />
                      <EstiloDeVida data={formData} onChange={(data) => setFormData({ ...formData, ...data })} obrigatorio />
                  </CardContent>
                </Card>
              </TabsContent>

                {anamnesisType === 'facial' && (
              <TabsContent value="facial_assessment">
                <Card>
                  <CardHeader>
                        <CardTitle>Avaliação Facial <span className="text-red-500">*</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                        <AvaliacaoFacial data={formData} onChange={(data) => setFormData({ ...formData, ...data })} obrigatorio />
                  </CardContent>
                </Card>
              </TabsContent>
                )}
                {anamnesisType === 'corporal' && (
              <TabsContent value="body_assessment">
                <Card>
                  <CardHeader>
                        <CardTitle>Avaliação Corporal <span className="text-red-500">*</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                        <AvaliacaoCorporal data={formData} onChange={(data) => setFormData({ ...formData, ...data })} obrigatorio />
                        <MedidasCorporais data={formData} onChange={(data) => setFormData({ ...formData, ...data })} obrigatorio />
                  </CardContent>
                </Card>
              </TabsContent>
                )}
                {anamnesisType === 'capilar' && (
              <TabsContent value="hair_assessment">
                <Card>
                  <CardHeader>
                        <CardTitle>Avaliação Capilar <span className="text-red-500">*</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                        <AvaliacaoCapilar data={formData} onChange={(data) => setFormData({ ...formData, ...data })} obrigatorio />
                  </CardContent>
                </Card>
              </TabsContent>
                )}
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="submit" disabled={loading} className="bg-pink-400 hover:bg-pink-500 text-white">
                  <Save className="h-4 w-4 mr-2" /> Salvar Anamnese
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default AnamnesisDataForm;
