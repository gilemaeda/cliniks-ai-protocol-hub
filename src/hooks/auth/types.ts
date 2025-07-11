
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  clinic_id?: string;
  full_name: string;
  cpf?: string;
  phone?: string;
  role: 'clinic_owner' | 'professional' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  subscriptionStatus: string | null;
}

export interface AuthActions {
  signUp: (
    email: string,
    password: string,
    userData: { full_name: string; role?: string; cpf?: string; phone?: string }
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSubscriptionStatus: () => Promise<string | null | undefined>;
}
