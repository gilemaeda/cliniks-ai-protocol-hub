
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAnamnesisForm = (
  patientId?: string,
  anamnesisType?: 'facial' | 'corporal' | 'capilar',
  clinicId?: string
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [selectedArea, setSelectedArea] = useState<'facial' | 'corporal' | 'capilar'>(anamnesisType || 'facial');
  const [patients, setPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('saude');
  const [clinic, setClinic] = useState<any>(null);

  // Estados para cada seção da anamnese
  const [historicoSaudeGeral, setHistoricoSaudeGeral] = useState({});
  const [estiloDeVida, setEstiloDeVida] = useState({});
  const [avaliacaoFacial, setAvaliacaoFacial] = useState({});
  const [avaliacaoCorporal, setAvaliacaoCorporal] = useState({});
  const [avaliacaoCapilar, setAvaliacaoCapilar] = useState({});
  const [medidasCorporais, setMedidasCorporais] = useState({});

  // Objeto formData consolidado
  const formData = {
    historicoSaudeGeral,
    estiloDeVida,
    avaliacaoFacial,
    avaliacaoCorporal,
    avaliacaoCapilar,
    medidasCorporais
  };

  const updateFormData = (section: string, data: any) => {
    switch (section) {
      case 'historicoSaudeGeral':
        setHistoricoSaudeGeral(data);
        break;
      case 'estiloDeVida':
        setEstiloDeVida(data);
        break;
      case 'avaliacaoFacial':
        setAvaliacaoFacial(data);
        break;
      case 'avaliacaoCorporal':
        setAvaliacaoCorporal(data);
        break;
      case 'avaliacaoCapilar':
        setAvaliacaoCapilar(data);
        break;
      case 'medidasCorporais':
        setMedidasCorporais(data);
        break;
    }
  };

  useEffect(() => {
    if (user) {
      fetchClinicData();
    }
  }, [user]);

  useEffect(() => {
    if (clinic?.clinic_id) {
      fetchPatients();
    }
  }, [clinic]);

  const fetchClinicData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (error) {
        console.error('Erro ao buscar dados da clínica:', error);
        return;
      }

      if (data && data.length > 0) {
        setClinic(data[0]);
        console.log('Clínica encontrada:', data[0]);
      } else {
        console.log('Nenhuma clínica encontrada para o usuário');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da clínica:', error);
    }
  };

  const fetchPatients = async () => {
    if (!clinic?.clinic_id) {
      console.log('Clinic ID não disponível:', clinic);
      return;
    }

    try {
      console.log('Buscando pacientes para clinic_id:', clinic.clinic_id);
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinic.clinic_id)
        .order('full_name');

      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        throw error;
      }

      console.log('Pacientes encontrados:', data);
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes",
        variant: "destructive"
      });
    }
  };

  const saveAnamnesis = async () => {
    if (!selectedPatientId || !clinic?.clinic_id) {
      toast({
        title: "Erro",
        description: "Selecione um paciente antes de salvar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const anamnesisData = {
        patient_id: selectedPatientId,
        clinic_id: clinic.clinic_id,
        anamnesis_type: selectedArea,
        general_health: historicoSaudeGeral,
        lifestyle: estiloDeVida,
        facial_assessment: selectedArea === 'facial' ? avaliacaoFacial : {},
        body_assessment: selectedArea === 'corporal' ? avaliacaoCorporal : {},
        body_measurements: selectedArea === 'corporal' ? medidasCorporais : {},
        hair_assessment: selectedArea === 'capilar' ? avaliacaoCapilar : {},
        created_by: user?.id,
        professional_id: user?.id
      };

      const { error } = await supabase
        .from('anamnesis_data')
        .insert(anamnesisData);

      if (error) throw error;

      toast({
        title: "Anamnese salva!",
        description: "Os dados da anamnese foram salvos com sucesso"
      });

      // Limpar formulário
      setHistoricoSaudeGeral({});
      setEstiloDeVida({});
      setAvaliacaoFacial({});
      setAvaliacaoCorporal({});
      setAvaliacaoCapilar({});
      setMedidasCorporais({});
      setSelectedPatientId('');
      setActiveTab('saude');

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

  const handleSave = async () => {
    await saveAnamnesis();
  };

  return {
    loading,
    selectedPatientId,
    selectedArea,
    patients,
    activeTab,
    clinic,
    historicoSaudeGeral,
    estiloDeVida,
    avaliacaoFacial,
    avaliacaoCorporal,
    avaliacaoCapilar,
    medidasCorporais,
    formData,
    setSelectedPatientId,
    setSelectedArea,
    setActiveTab,
    setHistoricoSaudeGeral,
    setEstiloDeVida,
    setAvaliacaoFacial,
    setAvaliacaoCorporal,
    setAvaliacaoCapilar,
    setMedidasCorporais,
    updateFormData,
    saveAnamnesis,
    handleSave
  };
};
