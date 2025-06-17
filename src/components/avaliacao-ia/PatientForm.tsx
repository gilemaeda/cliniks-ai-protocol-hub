
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Clock, Brain, Wrench, Beaker, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  full_name: string;
  age?: number;
}

interface ClinicResource {
  id: string;
  name: string;
  resource_type: string;
  category?: string;
  brand_model?: string;
}

interface AnamnesisData {
  id: string;
  patient_id: string;
  anamnesis_type: string;
  data: any;
}

interface PatientFormProps {
  onSubmit: (data: any) => void;
  assessmentType: string;
}

const PatientForm = ({ onSubmit, assessmentType }: PatientFormProps) => {
  const { user } = useAuth();
  const [useExistingPatient, setUseExistingPatient] = useState(true);
  const [useClinicResources, setUseClinicResources] = useState(true);
  const [useAnamnesisData, setUseAnamnesisData] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [equipments, setEquipments] = useState<ClinicResource[]>([]);
  const [products, setProducts] = useState<ClinicResource[]>([]);
  const [anamnesisOptions, setAnamnesisOptions] = useState<AnamnesisData[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<string[]>([]);
  const [manualData, setManualData] = useState({
    patient_name: '',
    patient_age: '',
    treatment_objective: '',
    main_complaint: '',
    observations: ''
  });

  useEffect(() => {
    if (useExistingPatient) {
      fetchPatients();
    }
    if (useClinicResources) {
      fetchClinicResources();
    }
    if (useAnamnesisData && selectedPatientId) {
      fetchAnamnesisData();
    }
  }, [useExistingPatient, useClinicResources, useAnamnesisData, selectedPatientId, user]);

  const fetchPatients = async () => {
    if (!user) return;

    try {
      console.log('Buscando pacientes para o usuário:', user.id);
      
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) {
        console.log('Nenhum dado de clínica encontrado');
        return;
      }

      const clinic = clinicData[0];
      if (!clinic.clinic_id) {
        console.log('Clinic ID não encontrado');
        return;
      }

      const { data: patientsData, error } = await supabase
        .from('patients')
        .select('id, full_name, age')
        .eq('clinic_id', clinic.clinic_id)
        .order('full_name');

      if (error) throw error;
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      setPatients([]);
    }
  };

  const fetchClinicResources = async () => {
    if (!user) return;

    try {
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) return;

      const clinic = clinicData[0];
      if (!clinic.clinic_id) return;

      // Buscar equipamentos
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('clinic_resources')
        .select('id, name, resource_type, category, brand_model')
        .eq('clinic_id', clinic.clinic_id)
        .eq('resource_type', 'equipment');

      if (!equipmentError) {
        setEquipments(equipmentData || []);
      }

      // Buscar produtos/cosméticos
      const { data: productData, error: productError } = await supabase
        .from('clinic_resources')
        .select('id, name, resource_type, category, brand_model')
        .eq('clinic_id', clinic.clinic_id)
        .in('resource_type', ['cosmetic', 'injectable']);

      if (!productError) {
        setProducts(productData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar recursos da clínica:', error);
    }
  };

  const fetchAnamnesisData = async () => {
    if (!user || !selectedPatientId) return;

    try {
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) return;

      const clinic = clinicData[0];
      if (!clinic.clinic_id) return;

      const { data: anamnesisData, error } = await supabase
        .from('anamnesis_data')
        .select('id, patient_id, anamnesis_type, data')
        .eq('clinic_id', clinic.clinic_id)
        .eq('patient_id', selectedPatientId);

      if (!error) {
        setAnamnesisOptions(anamnesisData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de anamnese:', error);
    }
  };

  const handleEquipmentChange = (equipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedEquipments(prev => [...prev, equipmentId]);
    } else {
      setSelectedEquipments(prev => prev.filter(id => id !== equipmentId));
    }
  };

  const handleProductChange = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleAnamnesisChange = (anamnesisId: string, checked: boolean) => {
    if (checked) {
      setSelectedAnamnesis(prev => [...prev, anamnesisId]);
    } else {
      setSelectedAnamnesis(prev => prev.filter(id => id !== anamnesisId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      useExistingPatient,
      useClinicResources,
      useAnamnesisData,
      selectedPatientId: useExistingPatient ? selectedPatientId : null,
      manualData: useExistingPatient ? null : manualData,
      assessmentType,
      selectedEquipments: useClinicResources ? selectedEquipments : [],
      selectedProducts: useClinicResources ? selectedProducts : [],
      selectedAnamnesis: useAnamnesisData ? selectedAnamnesis : [],
      clinicResourcesData: {
        equipments: equipments.filter(eq => selectedEquipments.includes(eq.id)),
        products: products.filter(prod => selectedProducts.includes(prod.id))
      },
      anamnesisContextData: anamnesisOptions.filter(an => selectedAnamnesis.includes(an.id))
    };

    console.log('Dados do formulário enviados:', formData);
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Configuração da Avaliação IA</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configurações da Avaliação */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Usar paciente cadastrado</Label>
                <p className="text-sm text-gray-500">
                  Vincular com paciente já cadastrado no sistema
                </p>
              </div>
              <Switch
                checked={useExistingPatient}
                onCheckedChange={setUseExistingPatient}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Usar recursos da clínica</span>
                </Label>
                <p className="text-sm text-gray-500">
                  A IA usará equipamentos e produtos cadastrados
                </p>
              </div>
              <Switch
                checked={useClinicResources}
                onCheckedChange={setUseClinicResources}
              />
            </div>

            {useClinicResources && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                {/* Seleção de Equipamentos */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4" />
                    <span>Equipamentos Disponíveis</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {equipments.map((equipment) => (
                      <div key={equipment.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equipment-${equipment.id}`}
                          checked={selectedEquipments.includes(equipment.id)}
                          onCheckedChange={(checked) => 
                            handleEquipmentChange(equipment.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`equipment-${equipment.id}`} className="text-sm">
                          {equipment.name} {equipment.brand_model && `(${equipment.brand_model})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {equipments.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum equipamento cadastrado</p>
                  )}
                </div>

                {/* Seleção de Produtos */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Beaker className="h-4 w-4" />
                    <span>Produtos/Cosméticos Disponíveis</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => 
                            handleProductChange(product.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`product-${product.id}`} className="text-sm">
                          {product.name} {product.brand_model && `(${product.brand_model})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {products.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum produto cadastrado</p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Usar dados de anamnese</span>
                </Label>
                <p className="text-sm text-gray-500">
                  A IA considerará dados de anamnese do paciente
                </p>
              </div>
              <Switch
                checked={useAnamnesisData}
                onCheckedChange={setUseAnamnesisData}
              />
            </div>

            {useAnamnesisData && useExistingPatient && anamnesisOptions.length > 0 && (
              <div className="space-y-2 pl-6 border-l-2 border-green-200">
                <Label>Dados de Anamnese Disponíveis</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {anamnesisOptions.map((anamnesis) => (
                    <div key={anamnesis.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`anamnesis-${anamnesis.id}`}
                        checked={selectedAnamnesis.includes(anamnesis.id)}
                        onCheckedChange={(checked) => 
                          handleAnamnesisChange(anamnesis.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`anamnesis-${anamnesis.id}`} className="text-sm">
                        Anamnese {anamnesis.anamnesis_type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Dados do Paciente */}
          {useExistingPatient ? (
            <div className="space-y-2">
              <Label htmlFor="patient-select">Selecionar Paciente *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um paciente cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name} {patient.age && `(${patient.age} anos)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patients.length === 0 && (
                <p className="text-sm text-amber-600">
                  Nenhum paciente encontrado. Cadastre pacientes primeiro ou use dados manuais.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Nome do Paciente *</Label>
                  <Input
                    id="patient_name"
                    value={manualData.patient_name}
                    onChange={(e) => setManualData(prev => ({ ...prev, patient_name: e.target.value }))}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_age">Idade *</Label>
                  <Input
                    id="patient_age"
                    type="number"
                    value={manualData.patient_age}
                    onChange={(e) => setManualData(prev => ({ ...prev, patient_age: e.target.value }))}
                    placeholder="Digite a idade"
                    min="1"
                    max="120"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment_objective">Objetivo do Tratamento *</Label>
                <Textarea
                  id="treatment_objective"
                  value={manualData.treatment_objective}
                  onChange={(e) => setManualData(prev => ({ ...prev, treatment_objective: e.target.value }))}
                  placeholder="Descreva o objetivo principal do tratamento"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_complaint">Queixa Principal *</Label>
                <Textarea
                  id="main_complaint"
                  value={manualData.main_complaint}
                  onChange={(e) => setManualData(prev => ({ ...prev, main_complaint: e.target.value }))}
                  placeholder="Descreva a queixa principal do paciente"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações Adicionais</Label>
                <Textarea
                  id="observations"
                  value={manualData.observations}
                  onChange={(e) => setManualData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Observações complementares (opcional)"
                  rows={2}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={useExistingPatient ? !selectedPatientId : !manualData.patient_name || !manualData.patient_age}
          >
            <Clock className="h-4 w-4 mr-2" />
            Gerar Protocolo IA
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PatientForm;
