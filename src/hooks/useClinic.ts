import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Clinic {
  id: string;
  owner_id: string;
  name: string;
  cnpj: string;
  [key: string]: any; // Para outras propriedades que possam existir
}

export const useClinic = () => {
  const { user, loading: authLoading } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchClinic = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (rpcError) {
        console.error('Erro ao buscar dados da clínica via RPC:', rpcError);
        throw rpcError;
      }

      if (data && data.length > 0) {
        // A RPC retorna um array, pegamos o primeiro elemento
        const clinicData = data[0];
        setClinic({
          id: clinicData.clinic_id,
          owner_id: clinicData.owner_id,
          name: clinicData.name,
          cnpj: clinicData.cnpj,
          ...clinicData // Inclui quaisquer outros campos retornados
        });
      } else {
        setClinic(null);
      }
    } catch (e) {
      console.error('Falha ao buscar clínica:', e);
      setError(e);
      setClinic(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchClinic();
    }
  }, [authLoading, fetchClinic]);

  return { clinic, loading, error, refetchClinic: fetchClinic };
};
