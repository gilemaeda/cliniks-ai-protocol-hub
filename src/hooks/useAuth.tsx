import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from './auth/types';
import { authService } from './auth/authService';
import { profileService } from './auth/profileService';
import { clinicService } from './auth/clinicService';
import { AuthContext } from './auth/authContext';

// Flag global para evitar múltiplas inicializações
let isInitializing = false;

// Funções para persistência local
const LOCAL_STORAGE_KEYS = {
  SESSION: 'cliniks_session',
  USER: 'cliniks_user',
  PROFILE: 'cliniks_profile',
  SUBSCRIPTION: 'cliniks_subscription',
  LAST_UPDATED: 'cliniks_auth_last_updated'
};

const saveToLocalStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

const getFromLocalStorage = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

// Tempo máximo de cache em minutos
const MAX_CACHE_AGE_MINUTES = 30;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Inicializar estados com dados do localStorage se disponíveis
  const [session, setSession] = useState<Session | null>(() => getFromLocalStorage(LOCAL_STORAGE_KEYS.SESSION));
  const [user, setUser] = useState<User | null>(() => getFromLocalStorage(LOCAL_STORAGE_KEYS.USER));
  const [profile, setProfile] = useState<Profile | null>(() => getFromLocalStorage(LOCAL_STORAGE_KEYS.PROFILE));
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>('TRIAL'); // Forçar TRIAL para quebrar o loop
  const [loading, setLoading] = useState(true);
  const initRef = useRef<boolean>(false);

  // Versão simplificada para inicializar a sessão uma única vez
  const initializeAuth = useCallback(async () => {
    // Evitar múltiplas inicializações
    if (isInitializing) {
      console.log('Já está inicializando em outro componente');
      return;
    }
    
    isInitializing = true;
    console.log('Inicializando autenticação - versão simplificada');
    
    try {
      // Obter sessão atual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        console.log('Sessão encontrada');
        setSession(currentSession);
        setUser(currentSession.user);
        saveToLocalStorage(LOCAL_STORAGE_KEYS.SESSION, currentSession);
        saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, currentSession.user);
        
        try {
          const profileData = await profileService.fetchProfile(currentSession.user.id);
          if (profileData) {
            console.log('Perfil encontrado');
            
            // Verificar se o usuário é proprietário com base nos metadados
            const userMetadata = currentSession.user.user_metadata || {};
            const isOwnerInMetadata = userMetadata.role === 'clinic_owner';
            
            // Se os metadados indicam que é proprietário mas o perfil não, corrigir
            if (isOwnerInMetadata && profileData.role !== 'clinic_owner') {
              console.log('Corrigindo role do perfil: deveria ser clinic_owner mas está como', profileData.role);
              
              // Atualizar o perfil no banco de dados
              try {
                const { data: updatedProfile, error } = await supabase
                  .from('profiles')
                  .update({ role: 'clinic_owner' })
                  .eq('id', profileData.id)
                  .select()
                  .single();
                  
                if (error) {
                  console.error('Erro ao atualizar role do perfil:', error);
                } else if (updatedProfile) {
                  console.log('Role do perfil atualizado com sucesso para clinic_owner');
                  profileData.role = 'clinic_owner';
                }
              } catch (updateError) {
                console.error('Erro ao tentar atualizar role do perfil:', updateError);
              }
            }
            
            setProfile(profileData);
            saveToLocalStorage(LOCAL_STORAGE_KEYS.PROFILE, profileData);
            
            // Forçar status TRIAL para evitar loops
            setSubscriptionStatus('TRIAL');
            saveToLocalStorage(LOCAL_STORAGE_KEYS.SUBSCRIPTION, 'TRIAL');
          }
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
        }
      } else {
        console.log('Nenhuma sessão encontrada');
        setSession(null);
        setUser(null);
        setProfile(null);
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
    } finally {
      setLoading(false);
      isInitializing = false;
    }
  }, []);

  // Efeito simplificado - inicializa apenas uma vez
  useEffect(() => {
    // Evitar inicialização duplicada
    if (initRef.current) {
      return;
    }
    
    initRef.current = true;
    initializeAuth();
    
    // Escutar mudanças de autenticação - simplificado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          saveToLocalStorage(LOCAL_STORAGE_KEYS.SESSION, newSession);
          saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, newSession.user);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setSubscriptionStatus(null);
        }
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [initializeAuth]);

  const signOut = async () => {
    setLoading(true);
    
    // Limpar localStorage
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PROFILE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_UPDATED);
    
    const { error } = await authService.signOut();
    if (error) {
      console.error('Error during signOut:', error);
    }
    
    // Limpar estados
    setSession(null);
    setUser(null);
    setProfile(null);
    setSubscriptionStatus(null);
    setLoading(false);
    
    return { error };
  };

  // Função para atualizar manualmente o status da assinatura
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!profile?.clinic_id) {
      console.log('refreshSubscriptionStatus: Sem clínica associada ao perfil');
      return;
    }
    
    setLoading(true);
    try {
      const status = await clinicService.fetchSubscriptionStatus(profile.clinic_id);
      console.log('refreshSubscriptionStatus: Novo status obtido:', status);
      
      setSubscriptionStatus(status);
      saveToLocalStorage(LOCAL_STORAGE_KEYS.SUBSCRIPTION, status);
      saveToLocalStorage(LOCAL_STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      
      return status;
    } catch (error) {
      console.error('refreshSubscriptionStatus: Erro ao atualizar status:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.clinic_id]);

  const value = {
    user,
    session,
    profile,
    loading,
    subscriptionStatus,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut,
    refreshSubscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
