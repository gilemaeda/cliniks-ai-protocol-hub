import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Assessment {
  id: string;
  professional_id: string;
  clinic_id: string;
  assessment_type: 'facial' | 'corporal' | 'capilar';
  main_complaint: string;
  observations: string;
  ai_protocol: string;
  patient_name: string;
  patient_age: number;
  treatment_objective: string;
  created_at: string;
  updated_at: string;
  is_manual_patient?: boolean;
  resource_usage_mode?: string;
  selected_resource_ids?: string[];
  manual_resources_text?: string;
  ai_generated_text?: string;
  ai_model?: string;
  professionals?: {
    id: string;
    user_id: string;
  };
}

export function useEvaluationsQuery(userId?: string) {
  return useQuery<Assessment[], Error>({
    queryKey: ['assessments', userId],
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 segundos (para atualizar mais frequentemente)
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Buscando avaliações para o usuário:', userId);

      // Primeiro, verificar se o usuário é um proprietário de clínica
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, clinic_id')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Erro ao obter perfil do usuário:', profileError);
        return [];
      }

      let clinicId: string | null = null;

      // Se for proprietário da clínica
      if (profileData.role === 'clinic_owner') {
        // Obter o ID da clínica do proprietário
        // Usando limit(1) e maybeSingle() para evitar erro quando há múltiplas clínicas
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('id')
          .eq('owner_id', userId)
          .limit(1)
          .maybeSingle();
        
        if (clinicError) {
          console.error('Erro ao obter clínica do proprietário:', clinicError);
          return [];
        }
        
        if (!clinicData) {
          console.log('Nenhuma clínica encontrada para o proprietário');
          return [];
        }
        
        clinicId = clinicData.id;
      }
      // Se for um profissional
      else if (profileData.role === 'professional') {
        // Obter o ID da clínica do profissional
        const { data: professionalData, error: professionalError } = await supabase
          .from('professionals')
          .select('clinic_id, id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .is('deleted_at', null)
          .single();
        
        if (professionalError) {
          console.error('Erro ao obter dados do profissional:', professionalError);
          return [];
        }
        
        clinicId = professionalData.clinic_id;
      }
      
      if (!clinicId) {
        console.log('ID da clínica não encontrado');
        return [];
      }
      
      console.log('Buscando avaliações para a clínica:', clinicId);
      
      // Buscar avaliações com informações do profissional
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          professionals (
            id,
            user_id
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (assessmentsError) {
        console.error('Erro ao buscar avaliações:', assessmentsError);
        throw assessmentsError;
      }
      
      console.log(`Encontradas ${assessmentsData?.length || 0} avaliações`);
      
      // Filtrar e validar dados antes de retornar
      const validAssessments = (assessmentsData || []).filter(assessment => 
        assessment && typeof assessment === 'object'
      );
      
      return validAssessments as Assessment[];
    }
  });
}
