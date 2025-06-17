import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEquipmentsQuery(userId?: string) {
  return useQuery<any[], Error>({
    queryKey: ['equipments', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Buscar dados da clínica
      const { data: clinicData, error: clinicError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: userId });
      if (clinicError) throw clinicError;
      if (!clinicData || clinicData.length === 0) throw new Error('Clínica não encontrada');
      const clinicId = clinicData[0].clinic_id;
      // Buscar equipamentos
      const { data, error } = await supabase
        .from('clinic_resources')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('resource_type', 'equipment')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
}
