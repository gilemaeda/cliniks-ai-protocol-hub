import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clinic, PlanStatus, PlanStatusLabel } from '@/types/clinic';

interface ClinicContextType {
  clinic: Clinic | null;
  loading: boolean;
  planStatus: PlanStatus;
  planStatusLabel: PlanStatusLabel;
  trialDaysRemaining: number | null;
  refetchClinic: () => void;
}

export const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState<PlanStatus>('LOADING');
  const [planStatusLabel, setPlanStatusLabel] = useState<PlanStatusLabel>('Carregando...');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  const fetchClinicData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setClinic(null);
      setPlanStatus('INACTIVE');
      setPlanStatusLabel('Inativo');
      return;
    }

    setLoading(true);
    try {
      // 1. Obter o ID da clínica do usuário
      const { data: userClinicData, error: rpcError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (rpcError || !userClinicData || userClinicData.length === 0) {
        if (rpcError) console.error('Erro na RPC get_user_clinic_data:', rpcError);
        setClinic(null);
        setPlanStatus('INACTIVE');
        setPlanStatusLabel('Inativo');
        return;
      }
      
      const clinicId = userClinicData[0].clinic_id;

      // 2. Buscar dados detalhados da clínica, incluindo o trial_ends_at
      const { data: clinicData, error: selectError } = await supabase
        .from('clinics')
        .select('*, trial_ends_at')
        .eq('id', clinicId)
        .single();

      if (selectError) {
        console.error('Erro ao buscar dados detalhados da clínica:', selectError);
        setClinic(null);
        setPlanStatus('INACTIVE');
        setPlanStatusLabel('Inativo');
        return;
      }

      if (clinicData) {
        // 3. Buscar a última assinatura da clínica para verificar seu status usando a Edge Function
        let subscriptionData = null;
        let subError = null;
        
        try {
          // Obter o token de autenticação
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          
          if (!token) {
            throw new Error('Sessão não encontrada');
          }
          
          // Chamar a Edge Function para buscar os dados da assinatura
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-subscription-data?clinic_id=${clinicData.id}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na Edge Function:', errorData);
            throw new Error(`Erro ${response.status}: ${errorData.error || 'Desconhecido'}`);
          }
          
          const result = await response.json();
          console.log('Dados da assinatura via Edge Function (ClinicContext):', result);
          
          subscriptionData = result.data;
        } catch (error) {
          console.error('Erro ao buscar assinatura via Edge Function:', error);
          // Continuamos o fluxo mesmo com erro
        }

        // Não precisamos mais verificar subError, pois estamos usando a Edge Function

        // 4. Determinar o status do plano
        const today = new Date();
        const trialEndDate = clinicData.trial_ends_at ? new Date(clinicData.trial_ends_at) : null;

        const subStatus = subscriptionData?.status;

        if (subStatus === 'ACTIVE' || subStatus === 'CONFIRMED') {
          setPlanStatus('ACTIVE');
          setPlanStatusLabel('Ativo');
          setTrialDaysRemaining(null);
        } else if (subStatus === 'PAST_DUE' || subStatus === 'EXPIRED' || subStatus === 'INACTIVE' && trialEndDate && trialEndDate <= today) {
          setPlanStatus('EXPIRED');
          setPlanStatusLabel('Expirado');
          setTrialDaysRemaining(0);
        } else if (trialEndDate && trialEndDate > today) {
          setPlanStatus('TRIAL');
          setPlanStatusLabel('Em Teste');
          const diffTime = trialEndDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setTrialDaysRemaining(diffDays);
        } else {
          setPlanStatus('INACTIVE');
          setPlanStatusLabel('Inativo');
          setTrialDaysRemaining(null);
        }

        // Lógica para URLs de logo e banner
        let logoUrl = clinicData.logo_url;
        if (logoUrl && !logoUrl.startsWith('http')) {
          const { data: signedUrlData } = await supabase.storage.from('clinic-assets').createSignedUrl(logoUrl, 3600);
          logoUrl = signedUrlData?.signedUrl ?? null;
        }

        let bannerUrl = clinicData.banner_url;
        if (bannerUrl && !bannerUrl.startsWith('http')) {
          const { data: signedUrlData } = await supabase.storage.from('clinic-assets').createSignedUrl(bannerUrl, 3600);
          bannerUrl = signedUrlData?.signedUrl ?? null;
        }

        setClinic({ ...clinicData, logo_url: logoUrl, banner_url: bannerUrl });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da clínica:', error);
      setClinic(null);
      setPlanStatus('INACTIVE');
      setPlanStatusLabel('Inativo');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  return (
    <ClinicContext.Provider value={{ clinic, loading, refetchClinic: fetchClinicData, planStatus, planStatusLabel, trialDaysRemaining }}>
      {children}
    </ClinicContext.Provider>
  );
};

// O hook useClinic foi movido para src/hooks/useClinic.ts para resolver o erro de lint do Fast Refresh.
