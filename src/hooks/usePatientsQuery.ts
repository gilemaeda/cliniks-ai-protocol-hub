import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/patient';

export function usePatientsQuery(userId?: string) {
  return useQuery<Patient[], Error>({
    queryKey: ['patients', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('User ID é necessário');

      const { data: clinicData, error: clinicError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: userId });
      
      if (clinicError) {
        console.error('Erro ao buscar dados da clínica:', clinicError);
        throw clinicError;
      }

      if (!clinicData || clinicData.length === 0) {
        return []; // Retorna array vazio se não encontrar clínica, evitando erro.
      }
      
      const clinicId = clinicData[0].clinic_id;

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        throw error;
      }
      
      return data || [];
    }
  });
}
