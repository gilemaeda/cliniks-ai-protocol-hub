
export interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  logo_url?: string;
  banner_url?: string;
  plan: string;
  plan_expires_at?: string;
  employee_count?: number;
  brand_colors?: {
    primary?: string;
    secondary?: string;
  };
  notification_settings?: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
  };
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: string;
  user_id: string;
  clinic_id: string;
  specialty?: string;
  council_number?: string;
  formation?: string;
  cpf?: string;
  phone?: string;
  birth_date?: string;
  is_active: boolean;
  equipment_list?: string[];
  preferences?: any;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}
