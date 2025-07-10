import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Protocol {
  id: string;
  name: string;
  description?: string;
  content: any;
  therapeutic_objective?: string;
  target_audience?: string;
  duration_weeks?: number;
  equipment_used?: string[];
  substances_used?: string[];
  created_at: string;
  updated_at: string;
  clinic_id: string;
  created_by?: string;
  profiles?: {
    full_name: string;
  };
}

export const useProtocolosQuery = (clinicId?: string) => {
  return useQuery({
    queryKey: ['protocolos', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      
      const { data, error } = await supabase
        .from('custom_protocols')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching protocols:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!clinicId,
  });
};