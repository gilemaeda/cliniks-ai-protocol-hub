
import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AuthState, AuthActions, Profile } from './auth/types';
import { authService } from './auth/authService';
import { profileService } from './auth/profileService';
import { clinicService } from './auth/clinicService';

export * from './auth/types';

const AuthContext = createContext<(AuthState & AuthActions) | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Verificar sessão existente primeiro
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession && isMounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Buscar perfil de forma assíncrona e mais rápida
          const profilePromise = profileService.fetchProfile(currentSession.user.id);
          
          profilePromise
            .then(profileData => {
              if (isMounted && profileData) {
                setProfile(profileData);
                
                // Garantir clínica para proprietários (em background)
                if (profileData.role === 'clinic_owner') {
                  clinicService.ensureClinicExists(currentSession.user.id, profileData.full_name)
                    .catch(error => console.error('Error ensuring clinic:', error));
                }
              }
            })
            .catch(error => console.error('Error fetching profile:', error));
          
          // Definir loading como false imediatamente após ter usuário
          if (isMounted) setLoading(false);
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (isMounted) setLoading(false);
      }
    };

    // Configurar listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false); // Definir loading como false imediatamente
          
          // Buscar perfil de forma assíncrona
          profileService.fetchProfile(currentSession.user.id)
            .then(profileData => {
              if (isMounted && profileData) {
                setProfile(profileData);
                
                if (profileData.role === 'clinic_owner') {
                  clinicService.ensureClinicExists(currentSession.user.id, profileData.full_name)
                    .catch(error => console.error('Error ensuring clinic:', error));
                }
              }
            })
            .catch(error => console.error('Error fetching profile:', error));
        }
      }
    );

    // Inicializar autenticação
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      setProfile(null);
      setSession(null);
      
      const { error } = await authService.signOut();
      if (error) {
        console.error('Error during signOut:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('SignOut failed:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState & AuthActions => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
