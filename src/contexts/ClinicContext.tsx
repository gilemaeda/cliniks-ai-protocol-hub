import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { Clinic, PlanStatus, PlanStatusLabel } from '@/types/clinic';

interface ClinicContextType {
  clinic: Clinic | null;
  loading: boolean;
  planStatus: PlanStatus;
  planStatusLabel: PlanStatusLabel;
  trialDaysRemaining: number | null;
  refetchClinic: () => Promise<void>;
}

export const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState<PlanStatus>('LOADING');
  const [planStatusLabel, setPlanStatusLabel] = useState<PlanStatusLabel>('Carregando...');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  const refetchClinic = async () => {
    if (!user || !profile?.clinic_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: clinicData, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

      if (error) {
        console.error('Error fetching clinic:', error);
        setClinic(null);
        setPlanStatus('INACTIVE');
        setPlanStatusLabel('Inativo');
      } else {
        setClinic({
          ...clinicData,
          brand_colors: (clinicData.brand_colors as any) || {},
          notification_settings: (clinicData.notification_settings as any) || {},
        });
        
        // Determine plan status
        if (clinicData.trial_ends_at) {
          const trialEndDate = new Date(clinicData.trial_ends_at);
          const now = new Date();
          const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0) {
            setPlanStatus('TRIAL');
            setPlanStatusLabel('Em Teste');
            setTrialDaysRemaining(daysRemaining);
          } else {
            setPlanStatus('EXPIRED');
            setPlanStatusLabel('Expirado');
            setTrialDaysRemaining(0);
          }
        } else if (clinicData.subscription_status === 'active') {
          setPlanStatus('ACTIVE');
          setPlanStatusLabel('Ativo');
          setTrialDaysRemaining(null);
        } else {
          setPlanStatus('INACTIVE');
          setPlanStatusLabel('Inativo');
          setTrialDaysRemaining(null);
        }
      }
    } catch (error) {
      console.error('Error in refetchClinic:', error);
      setClinic(null);
      setPlanStatus('INACTIVE');
      setPlanStatusLabel('Inativo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchClinic();
  }, [user, profile?.clinic_id]);

  const value: ClinicContextType = {
    clinic,
    loading,
    planStatus,
    planStatusLabel,
    trialDaysRemaining,
    refetchClinic,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};