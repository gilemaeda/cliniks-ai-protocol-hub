export type PlanStatus = 'TRIAL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'LOADING';
export type PlanStatusLabel = 'Em Teste' | 'Ativo' | 'Inativo' | 'Expirado' | 'Carregando...';

export interface ClinicStatistics {
  patients: number;
  protocols: number;
  assessments: number;
  anamnesis: number;
  professionals: number;
  photos: number;
}

export interface BrandColors {
  primary: string;
  header: string;
  background: string;
  secondary: string;
}

export interface NotificationSettings {
  email_notifications?: boolean;
  sms_notifications?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  cnpj: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  logo_url: string | null;
  banner_url: string | null;
  plan: string; // Mantido por retrocompatibilidade
  trial_ends_at: string | null;
  employee_count: number;
  brand_colors: BrandColors;
  notification_settings: NotificationSettings;
  owner_id: string;
}
