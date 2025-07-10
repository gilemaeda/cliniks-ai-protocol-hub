import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LegacyContent {
  generated_protocol?: string;
  [key: string]: unknown; // Permite outras chaves, mas com tipo 'unknown' que é mais seguro que 'any'
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
  content: string | LegacyContent;
  therapeutic_objective: string;
  target_audience: string;
  duration_weeks: number | null;
  equipment_used: string[];
  substances_used: string[];
  created_at: string;
  clinic_id?: string;
  created_by?: string;
  updated_at?: string;
  profiles: { // Nome do criador, vindo da tabela 'profiles'
    full_name: string | null;
  } | null;
}

export function useProtocolosQuery(userId?: string) {
  return useQuery<Protocol[], Error>({
    queryKey: ['protocolos', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('User ID é necessário');

      const { data: clinicData, error: clinicError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: userId });
      
      if (clinicError) throw clinicError;
      if (!clinicData || clinicData.length === 0) throw new Error('Clínica não encontrada');
      
      const clinicId = clinicData[0].clinic_id;

      // Busca protocolos e o nome do criador através de uma função RPC otimizada.
      const { data, error } = await supabase
        .rpc('get_protocols_for_clinic', { p_clinic_id: clinicId });

      if (error) throw error;
      return data || [];
    },
  });
}
