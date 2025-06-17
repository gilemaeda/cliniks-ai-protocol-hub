import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Professional } from '@/components/clinic/types';

export function useProfessionalsQuery(userId?: string) {
  return useQuery<Professional[], Error>({
    queryKey: ['professionals', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Buscar dados da clínica primeiro
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_id', userId)
        .single();

      if (clinicError || !clinicData) {
        throw new Error('Clínica não encontrada');
      }

      const { data, error } = await supabase
        .from('professionals')
        .select(`
          id,
          user_id,
          clinic_id,
          cpf,
          formation,
          council_number,
          phone,
          specialty,
          is_active,
          created_at,
          updated_at,
          profiles!inner(id, full_name, email, role)
        `)
        .eq('clinic_id', clinicData.id);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        clinic_id: item.clinic_id,
        cpf: item.cpf || '',
        formation: item.formation || '',
        council_number: item.council_number || '',
        phone: item.phone || '',
        specialty: item.specialty || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
        profiles: {
          id: item.profiles?.id || '',
          full_name: item.profiles?.full_name || 'Nome não informado',
          email: item.profiles?.email || 'Email não informado',
          role: item.profiles?.role || '',
        },
      }));
    }
  });
}
