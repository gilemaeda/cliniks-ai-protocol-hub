
import { supabase } from '@/integrations/supabase/client';

export const authService = {
  signUp: async (email: string, password: string, userData: { full_name: string; role?: string; cpf?: string; phone?: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('authService - Signing up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    console.log('authService - Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  },

  signOut: async () => {
    console.log('authService - Signing out user');
    const { error } = await supabase.auth.signOut();
    return { error };
  }
};
