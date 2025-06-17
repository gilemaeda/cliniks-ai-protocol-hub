import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface Clinic {
  id: string;
  name: string;
  cnpj: string;
  logo_url: string | null;
  banner_url: string | null;
  plan: string;
  employee_count: number;
  brand_colors: any;
  notification_settings: any;
  owner_id: string;
}

interface ClinicContextType {
  clinic: Clinic | null;
  loading: boolean;
  refetchClinic: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClinicData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setClinic(null);
      return;
    }

    setLoading(true);
    try {
      const { data: userClinicData, error: rpcError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (rpcError || !userClinicData || userClinicData.length === 0) {
        if (rpcError) console.error('Erro na RPC get_user_clinic_data:', rpcError);
        setClinic(null);
        return;
      }
      
      const clinicId = userClinicData[0].clinic_id;

      const { data: clinicData, error: selectError } = await supabase
        .from('clinics')
        .select('id, name, cnpj, logo_url, banner_url, plan, employee_count, brand_colors, notification_settings, owner_id')
        .eq('id', clinicId)
        .single();

      if (selectError) {
        console.error('Erro ao buscar dados detalhados da clínica:', selectError);
        setClinic(null);
        return;
      }

      if (clinicData) {
        let logoUrl = clinicData.logo_url;
        let bannerUrl = clinicData.banner_url;

        if (logoUrl && !logoUrl.startsWith('http')) {
          const { data: signedUrlData, error } = await supabase.storage.from('clinic-assets').createSignedUrl(logoUrl, 3600);
          logoUrl = error ? supabase.storage.from('clinic-assets').getPublicUrl('defaults/default-logo.png').data.publicUrl : signedUrlData?.signedUrl ?? '';
        } else if (!logoUrl) {
          logoUrl = supabase.storage.from('clinic-assets').getPublicUrl('defaults/default-logo.png').data.publicUrl;
        }

        if (bannerUrl && !bannerUrl.startsWith('http')) {
          const { data: signedUrlData, error } = await supabase.storage.from('clinic-assets').createSignedUrl(bannerUrl, 3600);
          bannerUrl = error ? supabase.storage.from('clinic-assets').getPublicUrl('defaults/default-banner.png').data.publicUrl : signedUrlData?.signedUrl ?? '';
        } else if (!bannerUrl) {
          bannerUrl = supabase.storage.from('clinic-assets').getPublicUrl('defaults/default-banner.png').data.publicUrl;
        }

        setClinic({
          ...clinicData,
          logo_url: logoUrl,
          banner_url: bannerUrl,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da clínica:', error);
      setClinic(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  return (
    <ClinicContext.Provider value={{ clinic, loading, refetchClinic: fetchClinicData }}>
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
