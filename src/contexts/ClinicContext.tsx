import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Tipos para o status do plano
export type PlanStatus = 'TRIAL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'LOADING';
export type PlanStatusLabel = 'Em Teste' | 'Ativo' | 'Inativo' | 'Expirado' | 'Carregando...';

interface Clinic {
  id: string;
  name: string;
  cnpj: string;
  logo_url: string | null;
  banner_url: string | null;
  plan: string; // Mantido por retrocompatibilidade, mas a lógica usará PlanStatus
  trial_ends_at: string | null; // Novo campo para o teste
  employee_count: number;
  brand_colors: Record<string, any>;
  notification_settings: Record<string, any>;
  owner_id: string;
}

interface ClinicContextType {
  clinic: Clinic | null;
  loading: boolean;
  refetchClinic: () => void;
  planStatus: PlanStatus;
  planStatusLabel: PlanStatusLabel;
  trialDaysRemaining: number | null;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

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
        // 3. Buscar assinatura ativa
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('clinic_id', clinicData.id)
          .in('status', ['ACTIVE', 'CONFIRMED'])
          .maybeSingle();

        // 4. Determinar o status do plano
        const today = new Date();
        const trialEndDate = clinicData.trial_ends_at ? new Date(clinicData.trial_ends_at) : null;

        if (subscriptionData) {
          setPlanStatus('ACTIVE');
          setPlanStatusLabel('Ativo');
          setTrialDaysRemaining(null);
        } else if (trialEndDate && trialEndDate > today) {
          setPlanStatus('TRIAL');
          setPlanStatusLabel('Em Teste');
          const diffTime = trialEndDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setTrialDaysRemaining(diffDays);
        } else if (trialEndDate && trialEndDate <= today) {
          setPlanStatus('EXPIRED');
          setPlanStatusLabel('Expirado');
          setTrialDaysRemaining(0);
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

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
