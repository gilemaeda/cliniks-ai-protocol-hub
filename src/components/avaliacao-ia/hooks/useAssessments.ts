
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { useToast } from '@/hooks/use-toast';
import { Assessment } from '../types/assessment';

export const useAssessments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAssessments();
    }
  }, [profile]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      if (!profile?.id) {
        console.log('Perfil não encontrado');
        setLoading(false);
        return;
      }

      console.log('Buscando avaliações para o perfil:', profile.id, 'role:', profile.role);

      let assessmentsData: any[] = [];

      if (profile.role === 'clinic_owner') {
        // Buscar clínica do proprietário usando a função de segurança
        const { data: clinicId, error: clinicError } = await supabase
          .rpc('get_user_clinic_id');

        if (clinicError) {
          console.error('Erro ao buscar clínica:', clinicError);
          toast({
            title: "Erro ao carregar histórico",
            description: "Não foi possível encontrar sua clínica",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        if (!clinicId) {
          console.log('Clínica não encontrada para o proprietário');
          setAssessments([]);
          setLoading(false);
          return;
        }

        // Buscar avaliações da clínica
        const { data: assessmentsResult, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false });

        if (assessmentsError) {
          console.error('Erro ao buscar avaliações:', assessmentsError);
          toast({
            title: "Erro ao carregar histórico",
            description: "Não foi possível carregar o histórico de avaliações",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        assessmentsData = assessmentsResult || [];

      } else if (profile.role === 'professional') {
        // Se for profissional, buscar suas avaliações usando a função de segurança
        const { data: professionalData, error: professionalError } = await supabase
          .rpc('get_user_professional_data')
          .single();

        if (professionalError) {
          console.error('Erro ao buscar dados do profissional:', professionalError);
          toast({
            title: "Erro ao carregar histórico",
            description: "Não foi possível carregar seus dados de profissional",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        if (!professionalData) {
          console.log('Dados do profissional não encontrados');
          setAssessments([]);
          setLoading(false);
          return;
        }

        // Buscar avaliações do profissional
        const { data: assessmentsResult, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .eq('professional_id', professionalData.professional_id)
          .order('created_at', { ascending: false });

        if (assessmentsError) {
          console.error('Erro ao buscar avaliações do profissional:', assessmentsError);
          toast({
            title: "Erro ao carregar histórico",
            description: "Não foi possível carregar o histórico de avaliações",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        assessmentsData = assessmentsResult || [];
      }

      console.log('Avaliações encontradas:', assessmentsData.length);

      // Buscar nomes dos profissionais para cada avaliação
      const assessmentsWithProfessionals = await Promise.all(
        assessmentsData.map(async (assessment) => {
          let professionalName = 'Nome não disponível';
          
          if (assessment.professional_id) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', assessment.professional_id)
                .maybeSingle();
              
              if (profileData) {
                professionalName = profileData.full_name;
              }
            } catch (error) {
              console.error('Erro ao buscar nome do profissional:', error);
            }
          }

          return {
            ...assessment,
            professional_name: professionalName
          };
        })
      );
      
      setAssessments(assessmentsWithProfessionals);

    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as avaliações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    assessments,
    loading,
    refetch: fetchAssessments
  };
};
