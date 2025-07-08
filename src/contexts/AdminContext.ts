import { createContext } from 'react';
import { AdminUser } from '@/hooks/useAdminAuth';

// Definir tipo para as configurações do sistema
export interface SystemSettings {
  [key: string]: string | number | boolean | null;
}

// Definir tipo para a sessão do Supabase
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AdminContextType {
  adminUser: AdminUser | null;
  adminLoading: boolean;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<{session: SupabaseSession, adminUser: AdminUser} | undefined>;
  adminLogout: () => Promise<void>;
  systemSettings: SystemSettings | null;
  settingsLoading: boolean;
  refreshSettings: () => Promise<void>;
  saveSettings: (key: string, value: string | number | boolean | null) => Promise<Record<string, unknown>>;
  adminUsers: AdminUser[];
  usersLoading: boolean;
  fetchAdminUsers: () => Promise<void>;
}

// Criar e exportar o contexto
const AdminContext = createContext<AdminContextType | null>(null);

export default AdminContext;
export { AdminContext };
