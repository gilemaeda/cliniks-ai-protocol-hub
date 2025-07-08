import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { useToast } from '@/hooks/use-toast';
import { usePatientsQuery } from '@/hooks/usePatientsQuery';
import { ArrowLeft, Upload, Wand2, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStatePreservation } from '@/hooks/useStatePreservation';

interface FormularioAvaliacaoProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
  assessmentType?: 'facial' | 'corporal' | 'capilar';
}

const FormularioAvaliacao = ({ 
  onCancel, 
  onSuccess, 
  onBack, 
  assessmentType = 'facial' 
}: FormularioAvaliacaoProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: patients, isLoading: isLoadingPatients, error: patientsError } = usePatientsQuery(user?.id);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [revalLoading, setRevalLoading] = useState(false);
  
  // Usar useStatePreservation para preservar o estado entre recarregamentos
  const [tipoAvaliacao, setTipoAvaliacao] = useStatePreservation<'facial' | 'corporal' | 'capilar'>(
    'form_tipo_avaliacao', 
    assessmentType
  );

  // Estados para modo de edição/clonagem com persistência
  const [isEditMode, setIsEditMode] = useStatePreservation<boolean>('form_is_edit_mode', false);
  const [isCloneMode, setIsCloneMode] = useStatePreservation<boolean>('form_is_clone_mode', false);
  const [assessmentId, setAssessmentId] = useStatePreservation<string | null>('form_assessment_id', null);

  // Estados dos campos do formulário com persistência
  const [modoPaciente, setModoPaciente] = useStatePreservation<'cadastrado' | 'manual'>('form_modo_paciente', 'cadastrado');
  const [paciente, setPaciente] = useStatePreservation<string>('form_paciente', '');
  const [idadePaciente, setIdadePaciente] = useStatePreservation<number>('form_idade_paciente', 0);
  const [dadosPacienteManual, setDadosPacienteManual] = useStatePreservation('form_dados_paciente_manual', { nome: '', idade: 30 });
  const [queixaPrincipal, setQueixaPrincipal] = useStatePreservation<string>('form_queixa_principal', '');
  const [resultadoEsperado, setResultadoEsperado] = useStatePreservation<string>('form_resultado_esperado', '');
  const [observacoes, setObservacoes] = useStatePreservation<string>('form_observacoes', '');

  // Estados para recursos com persistência
  const [modoRecursos, setModoRecursos] = useStatePreservation<'cadastrados' | 'manual'>('form_modo_recursos', 'cadastrados');
  const [recursosSelecionados, setRecursosSelecionados] = useStatePreservation<string[]>('form_recursos_selecionados', []);
  const [recursosManual, setRecursosManual] = useStatePreservation<string>('form_recursos_manual', '');

  // IDs da clínica e profissional com persistência
  const [clinicId, setClinicId] = useStatePreservation<string>('form_clinic_id', '');
  const [professionalId, setProfessionalId] = useStatePreservation<string>('form_professional_id', '');

  // O estado 'patients' foi removido e substituído pelo hook usePatientsQuery.
  
  interface ResourcesType {
    equipamentos: Array<{id: string; name: string; purpose?: string}>;
    cosmeticos: Array<{id: string; name: string; purpose?: string}>;
    injetaveis: Array<{id: string; name: string; purpose?: string}>;
  }
  
  const [recursos, setRecursos] = useStatePreservation<ResourcesType>('form_recursos', {
    equipamentos: [],
    cosmeticos: [],
    injetaveis: []
  });

  // Buscar clinic_id do usuário
  const fetchUserClinicData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_professional_data');

      if (error) {
        console.error('Erro ao obter dados da clínica:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível obter dados da sua clínica. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (data && data.length > 0) {
        setClinicId(data[0].clinic_id);
        setProfessionalId(data[0].professional_id);
      }

      // Buscar a role do usuário para saber se é proprietário ou profissional
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileData) {
        // Não usamos mais setUserRole, pois temos o profile disponível
        // setUserRole(profileData.role);
      }

    } catch (error) {
      console.error('Erro ao obter dados da clínica:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [user?.id, toast]);

  // A função fetchPatients foi removida e substituída pelo hook usePatientsQuery

  // Buscar recursos da clínica
  const fetchResources = useCallback(async () => {
    if (!clinicId) return;

    try {
      const { data, error } = await supabase
        .from('clinic_resources')
        .select('*')
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Erro ao buscar recursos:', error);
        return;
      }

      // Separar os recursos por tipo
      const equipamentos = data?.filter(r => r.resource_type === 'equipment') || [];
      const cosmeticos = data?.filter(r => r.resource_type === 'cosmetic') || [];
      const injetaveis = data?.filter(r => r.resource_type === 'injectable') || [];
      
      setRecursos({
        equipamentos,
        cosmeticos,
        injetaveis
      });
    } catch (error) {
      console.error('Erro ao buscar recursos:', error);
    }
  }, [clinicId]);

  // Efeito para carregar dados da clínica e recursos
  useEffect(() => {
    fetchUserClinicData();
  }, [fetchUserClinicData]);

  useEffect(() => {
    if (clinicId) {
      fetchResources();
    }
  }, [clinicId, fetchResources]);

  // Efeito para lidar com erros na busca de pacientes
  useEffect(() => {
    if (patientsError) {
      toast({
        title: 'Erro ao carregar pacientes',
        description: patientsError.message,
        variant: 'destructive',
      });
    }
  }, [patientsError, toast]);

  useEffect(() => {
    // Atualizar idade do paciente quando selecionar um paciente
    if (modoPaciente === 'cadastrado' && paciente) {
      const selectedPatient = patients.find(p => p.id === paciente);
      if (selectedPatient && selectedPatient.age) {
        setIdadePaciente(selectedPatient.age);
      }
    } else if (modoPaciente === 'manual') {
      setIdadePaciente(dadosPacienteManual.idade);
    }
  }, [paciente, modoPaciente, dadosPacienteManual.idade, patients]);

  // Atualizar tipo de avaliação quando o prop assessmentType mudar
  useEffect(() => {
    if (assessmentType) {
      setTipoAvaliacao(assessmentType);
    }
  }, [assessmentType]);

  // Verificar se há dados para clonagem ou edição no sessionStorage
  useEffect(() => {
    const checkForStoredData = () => {
      // Verificar se há dados para clonagem
      const cloneData = sessionStorage.getItem('cloneAssessment');
      if (cloneData) {
        const parsedData = JSON.parse(cloneData);
        setIsCloneMode(true);
        populateForm(parsedData);
        // Limpar o storage após usar
        sessionStorage.removeItem('cloneAssessment');
      }

      // Verificar se há dados para edição
      const editData = sessionStorage.getItem('editAssessment');
      if (editData) {
        const parsedData = JSON.parse(editData);
        setIsEditMode(true);
        setAssessmentId(parsedData.id);
        populateForm(parsedData);
        // Limpar o storage após usar
        sessionStorage.removeItem('editAssessment');
      }
    };

    // Função para preencher o formulário com os dados
    const populateForm = (data: Record<string, any>) => {
      if (data.assessment_type) {
        setTipoAvaliacao(data.assessment_type);
      }
      
      // Definir modo de paciente
      setModoPaciente(data.is_manual_patient ? 'manual' : 'cadastrado');
      
      // Preencher dados do paciente
      if (data.is_manual_patient) {
        setDadosPacienteManual({
          nome: data.patient_name || '',
          idade: data.patient_age || 30
        });
      }
      
      // Definir modo de recursos
      if (data.resource_usage_mode) {
        setModoRecursos(data.resource_usage_mode);
      }
      
      // Preencher recursos selecionados ou manuais
      if (data.selected_resource_ids) {
        setRecursosSelecionados(data.selected_resource_ids);
      }
      
      if (data.manual_resources_text) {
        setRecursosManual(data.manual_resources_text);
      }
      
      // Preencher os demais campos
      setQueixaPrincipal(data.main_complaint || '');
      setResultadoEsperado(data.treatment_objective || '');
      setObservacoes(data.observations || '');
    };

    // Executar a verificação após o carregamento inicial
    checkForStoredData();
  }, []);

  const handleResourceToggle = (resourceId: string) => {
    setRecursosSelecionados(prev => {
      if (prev.includes(resourceId)) {
        return prev.filter(id => id !== resourceId);
      } else {
        return [...prev, resourceId];
      }
    });
  };

  // Função para gerar protocolo de IA
  const generateAIProtocol = async (assessmentId: string) => {
    if (!assessmentId) return;

    setRevalLoading(true);
    
    toast({
      title: 'Processando',
      description: 'Gerando novo protocolo com IA...',
    });

    // Definir nome do paciente com base no modo
    const patientName = modoPaciente === 'cadastrado' 
      ? patients.find(p => p.id === paciente)?.full_name 
      : dadosPacienteManual.nome;

    const patientAge = modoPaciente === 'cadastrado' 
      ? patients.find(p => p.id === paciente)?.age || idadePaciente
      : dadosPacienteManual.idade;

    // Obter recursos selecionados
    let selectedResources = [];
    
    try {
      if (modoRecursos === 'cadastrados' && recursosSelecionados?.length > 0) {
        const { data: resourcesData } = await supabase
          .from('clinic_resources')
          .select('*')
          .in('id', recursosSelecionados);
        
        selectedResources = resourcesData || [];
      }

      // Chamar a Edge Function para gerar o protocolo
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-assessment', {
        body: {
          assessment_type: tipoAvaliacao,
          patient_name: patientName,
          patient_age: patientAge,
          main_complaint: queixaPrincipal,
          treatment_objective: resultadoEsperado,
          observations: observacoes,
          clinic_resources: selectedResources
        }
      });

      if (aiError) {
        console.error('Erro ao gerar protocolo da IA:', aiError);
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o protocolo de IA. Tente novamente.',
          variant: 'destructive',
        });
      } else if (aiData?.protocol) {
        console.log('Protocolo da IA gerado:', aiData);
        
        // Atualizar a avaliação com o protocolo gerado
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ 
            ai_protocol: aiData.protocol,
            ai_model: aiData.model || 'gpt-4o-mini'
          })
          .eq('id', assessmentId);
        
        if (updateError) {
          console.error('Erro ao atualizar avaliação com protocolo IA:', updateError);
          toast({
            title: 'Erro',
            description: 'Não foi possível salvar o protocolo de IA. Tente novamente.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sucesso',
            description: 'Protocolo de IA atualizado com sucesso!',
          });
        }
      }
    } catch (_) {
      // Tratar erro sem referência direta à variável
      console.error('Erro ao gerar protocolo da IA');
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRevalLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validação
    if (modoPaciente === 'cadastrado' && !paciente) {
      toast({
        title: 'Erro',
        description: 'Selecione um paciente antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (modoPaciente === 'manual' && !dadosPacienteManual.nome) {
      toast({
        title: 'Erro',
        description: 'Informe o nome do paciente antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!queixaPrincipal) {
      toast({
        title: 'Erro',
        description: 'Informe a queixa principal antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!resultadoEsperado) {
      toast({
        title: 'Erro',
        description: 'Informe o resultado esperado antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!clinicId) {
      toast({
        title: 'Erro',
        description: 'Clínica não identificada.',
        variant: 'destructive',
      });
      return;
    }

    if (!professionalId) {
      toast({
        title: 'Erro',
        description: 'Profissional não identificado.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Definir nome do paciente com base no modo
      const patientName = modoPaciente === 'cadastrado' 
        ? patients.find(p => p.id === paciente)?.full_name 
        : dadosPacienteManual.nome;

      const patientAge = modoPaciente === 'cadastrado' 
        ? patients.find(p => p.id === paciente)?.age || idadePaciente
        : dadosPacienteManual.idade;

      // Preparar dados para inserção
      const assessmentData = {
        patient_name: patientName,
        clinic_id: clinicId,
        professional_id: professionalId, // Usar o ID do profissional, não o ID do usuário
        main_complaint: queixaPrincipal,
        treatment_objective: resultadoEsperado,
        observations: observacoes,
        assessment_type: tipoAvaliacao,
        patient_age: patientAge,
        selected_resource_ids: recursosSelecionados,
        resource_usage_mode: modoRecursos,
        manual_resources_text: modoRecursos === 'manual' ? recursosManual : null,
        is_manual_patient: modoPaciente === 'manual'
      };

      console.log('Dados da avaliação a serem enviados:', assessmentData);

      let savedAssessment;
      let error;

      // Se estamos em modo de edição, atualizar a avaliação existente
      if (isEditMode && assessmentId) {
        const response = await supabase
          .from('assessments')
          .update(assessmentData)
          .eq('id', assessmentId)
          .select();
        
        error = response.error;
        savedAssessment = response.data?.[0];
      } 
      // Caso contrário, criar uma nova avaliação
      else {
        const response = await supabase
          .from('assessments')
          .insert([assessmentData])
          .select();
        
        error = response.error;
        savedAssessment = response.data?.[0];
      }

      if (error) {
        console.error('Erro ao salvar avaliação:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar a avaliação. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Avaliação salva com sucesso:', savedAssessment);

      // Obter recursos selecionados
      let selectedResources = [];
      if (modoRecursos === 'cadastrados' && recursosSelecionados?.length > 0) {
        const { data: resourcesData } = await supabase
          .from('clinic_resources')
          .select('*')
          .in('id', recursosSelecionados);
        
        selectedResources = resourcesData || [];
      }

      // Se não estamos em modo de edição ou estamos em modo de clonagem, gerar um novo protocolo de IA
      // No modo de edição simples, mantemos o protocolo existente
      if (!isEditMode || isCloneMode) {
        try {
          const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-assessment', {
            body: {
              assessment_type: tipoAvaliacao,
              patient_name: patientName,
              patient_age: patientAge,
              main_complaint: queixaPrincipal,
              treatment_objective: resultadoEsperado,
              observations: observacoes,
              clinic_resources: selectedResources
            }
          });

          if (aiError) {
            console.error('Erro ao gerar protocolo da IA:', aiError);
          } else {
            console.log('Protocolo da IA gerado:', aiData);
            
            // Atualizar a avaliação com o protocolo gerado
            if (savedAssessment && aiData.protocol) {
              const { error: updateError } = await supabase
                .from('assessments')
                .update({ 
                  ai_protocol: aiData.protocol,
                  ai_model: aiData.model || 'gpt-4o-mini'
                })
                .eq('id', savedAssessment.id);
              
              if (updateError) {
                console.error('Erro ao atualizar avaliação com protocolo IA:', updateError);
              }
            }
          }
        } catch (aiError) {
          console.error('Erro ao gerar protocolo da IA:', aiError);
        }
      }

      toast({
        title: 'Sucesso',
        description: isEditMode 
          ? 'Avaliação atualizada com sucesso!' 
          : 'Avaliação salva com sucesso!',
      });
      
      // Redirecionamento após salvar
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Adicionar evento para detectar quando a página volta a ficar visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Formulário de avaliação: página voltou a ficar visível');
        
        // Verificar se há dados salvos no localStorage
        // (isso já é feito automaticamente pelo hook useStatePreservation)
        
        // Recarregar recursos se necessário
        if (clinicId && modoRecursos === 'cadastrados' && recursos.equipamentos.length === 0) {
          fetchResources();
        }
      }
    };

    const handleTabFocused = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Tab focada, tempo desde último foco:', customEvent.detail?.timeSinceLastFocus);
      
      // Recarregar recursos se necessário
      if (clinicId && modoRecursos === 'cadastrados' && recursos.equipamentos.length === 0) {
        fetchResources();
      }
      
      // Solicitar preservação de estado se o TabStateManager estiver disponível
      if (window.TabStateManager) {
        window.TabStateManager.preserveState();
      }
    };

    const handleTabBlurred = () => {
      console.log('Tab perdeu foco, salvando estado...');
      
      // Forçar salvamento de todos os estados no localStorage
      // (isso já é feito automaticamente pelo hook useStatePreservation)
      
      // Solicitar preservação de estado se o TabStateManager estiver disponível
      if (window.TabStateManager) {
        window.TabStateManager.preserveState();
      }
    };

    // Adicionar listeners para eventos de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    // Adicionar listeners para eventos personalizados do TabStateManager
    window.addEventListener('app:tabFocused', handleTabFocused);
    window.addEventListener('app:tabBlurred', handleTabBlurred);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('app:tabFocused', handleTabFocused);
      window.removeEventListener('app:tabBlurred', handleTabBlurred);
    };
  }, [clinicId, modoRecursos, recursos.equipamentos.length]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Wand2 className="mr-2 h-5 w-5" />
          {isEditMode 
            ? `Editar Avaliação - ${tipoAvaliacao === 'facial' ? 'Facial' : tipoAvaliacao === 'corporal' ? 'Corporal' : 'Capilar'}`
            : isCloneMode
              ? `Clonar Avaliação - ${tipoAvaliacao === 'facial' ? 'Facial' : tipoAvaliacao === 'corporal' ? 'Corporal' : 'Capilar'}`
              : `Formulário de Avaliação com IA - ${tipoAvaliacao === 'facial' ? 'Facial' : tipoAvaliacao === 'corporal' ? 'Corporal' : 'Capilar'}`
          }
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isEditMode 
            ? 'Edite os dados da avaliação existente'
            : isCloneMode
              ? 'Crie uma nova avaliação baseada em outra existente'
              : 'Preencha os dados para iniciar a avaliação com inteligência artificial'
          }
        </p>
      </CardHeader>
      {initialLoading ? (
        <CardContent className="text-center py-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Carregando dados da clínica...</p>
          </div>
        </CardContent>
      ) : (
        <CardContent className="space-y-6">
        {/* Tipo de Avaliação (somente se não vier da prop) */}
        {!assessmentType && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Avaliação</Label>
            <RadioGroup 
              defaultValue={tipoAvaliacao} 
              className="flex space-x-4"
              onValueChange={(value) => setTipoAvaliacao(value as 'facial' | 'corporal' | 'capilar')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="facial" id="facial" />
                <Label htmlFor="facial">Facial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="corporal" id="corporal" />
                <Label htmlFor="corporal">Corporal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="capilar" id="capilar" />
                <Label htmlFor="capilar">Capilar</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Dados do Paciente */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Dados do Paciente</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="paciente-cadastrado"
                  name="modo-paciente"
                  checked={modoPaciente === 'cadastrado'}
                  onChange={() => setModoPaciente('cadastrado')}
                />
                <Label htmlFor="paciente-cadastrado" className="text-sm">Paciente Cadastrado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="paciente-manual"
                  name="modo-paciente"
                  checked={modoPaciente === 'manual'}
                  onChange={() => setModoPaciente('manual')}
                />
                <Label htmlFor="paciente-manual" className="text-sm">Inserir Manualmente</Label>
              </div>
            </div>
          </div>

          {modoPaciente === 'cadastrado' ? (
            <Select onValueChange={setPaciente}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingPatients ? (
                  <SelectItem value="loading" disabled>Carregando pacientes...</SelectItem>
                ) : (patients || []).map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome-paciente" className="text-sm">Nome</Label>
                <Input
                  id="nome-paciente"
                  value={dadosPacienteManual.nome}
                  onChange={(e) => setDadosPacienteManual({...dadosPacienteManual, nome: e.target.value})}
                  placeholder="Nome do paciente"
                />
              </div>
              <div>
                <Label htmlFor="idade-paciente" className="text-sm">Idade</Label>
                <Input
                  id="idade-paciente"
                  type="number"
                  min={1}
                  max={120}
                  value={dadosPacienteManual.idade}
                  onChange={(e) => setDadosPacienteManual({...dadosPacienteManual, idade: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Queixa Principal */}
        <div className="space-y-2">
          <Label htmlFor="queixa" className="text-sm font-medium">
            Queixa Principal
          </Label>
          <Textarea
            id="queixa"
            placeholder="Descreva a queixa principal do paciente"
            value={queixaPrincipal}
            onChange={(e) => setQueixaPrincipal(e.target.value)}
            className="resize-none"
          />
        </div>

        {/* Resultado Esperado */}
        <div className="space-y-2">
          <Label htmlFor="resultado" className="text-sm font-medium">
            Resultado Esperado
          </Label>
          <Textarea
            id="resultado"
            placeholder="Descreva o resultado esperado pelo paciente"
            value={resultadoEsperado}
            onChange={(e) => setResultadoEsperado(e.target.value)}
            className="resize-none"
          />
        </div>

        {/* Recursos */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Recursos a serem utilizados</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="recursos-cadastrados"
                  name="modo-recursos"
                  checked={modoRecursos === 'cadastrados'}
                  onChange={() => setModoRecursos('cadastrados')}
                />
                <Label htmlFor="recursos-cadastrados" className="text-sm">Recursos Cadastrados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="recursos-manual"
                  name="modo-recursos"
                  checked={modoRecursos === 'manual'}
                  onChange={() => setModoRecursos('manual')}
                />
                <Label htmlFor="recursos-manual" className="text-sm">Inserir Manualmente</Label>
              </div>
            </div>
          </div>

          {modoRecursos === 'cadastrados' ? (
            <Tabs defaultValue="equipamentos">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                <TabsTrigger value="cosmeticos">Cosméticos</TabsTrigger>
                <TabsTrigger value="injetaveis">Injetáveis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="equipamentos" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {recursos.equipamentos.map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`resource-${resource.id}`}
                        checked={recursosSelecionados.includes(resource.id)}
                        onChange={() => handleResourceToggle(resource.id)}
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`resource-${resource.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {resource.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="cosmeticos" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {recursos.cosmeticos.map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`resource-${resource.id}`}
                        checked={recursosSelecionados.includes(resource.id)}
                        onChange={() => handleResourceToggle(resource.id)}
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`resource-${resource.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {resource.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="injetaveis" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {recursos.injetaveis.map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`resource-${resource.id}`}
                        checked={recursosSelecionados.includes(resource.id)}
                        onChange={() => handleResourceToggle(resource.id)}
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`resource-${resource.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {resource.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Textarea
              placeholder="Descreva manualmente os recursos que serão utilizados (equipamentos, cosméticos, injetáveis, etc.)"
              className="resize-none"
              rows={4}
              value={recursosManual}
              onChange={(e) => setRecursosManual(e.target.value)}
            />
          )}
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observacoes" className="text-sm font-medium">
            Observações Adicionais
          </Label>
          <Textarea
            id="observacoes"
            placeholder="Informações adicionais importantes para a avaliação"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack || onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {onBack ? 'Voltar' : 'Cancelar'}
          </Button>
          <div className="flex gap-2">
            {isEditMode && assessmentId && (
              <Button 
                variant="outline" 
                onClick={() => generateAIProtocol(assessmentId)} 
                disabled={loading || revalLoading}
              >
                {revalLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reavaliando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reavaliar com IA
                  </>
                )}
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={loading || revalLoading}>
              {loading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Atualizando...' : 'Avaliando...'}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Atualizar Avaliação' : 'Iniciar Avaliação'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    )}
    </Card>
  );
};

export default FormularioAvaliacao;
