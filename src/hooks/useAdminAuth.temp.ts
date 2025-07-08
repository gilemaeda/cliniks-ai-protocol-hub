import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_master: boolean;
  is_active: boolean;
  created_at: string;
}

export const useAdminAuth = () => {
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);
  
  // Chaves específicas para armazenamento administrativo
  const ADMIN_AUTH_KEY = 'cliniks_admin_auth';
  const ADMIN_DATA_KEY = 'cliniks_admin_data';
  
  // Função para carregar a sessão administrativa
  const loadAdminSession = useCallback(async () => {
    try {
      console.log('useAdminAuth: Inicializando sessão administrativa...');
      
      // Verificar primeiro no localStorage
      const adminAuth = localStorage.getItem(ADMIN_AUTH_KEY);
      const adminDataStr = localStorage.getItem(ADMIN_DATA_KEY);
      
      if (adminAuth !== 'authenticated' || !adminDataStr) {
        console.log('useAdminAuth: Nenhuma sessão administrativa encontrada no localStorage');
        setAdminSession(null);
        setAdminUser(null);
        setAdminLoading(false);
        return;
      }
      
      console.log('useAdminAuth: Dados administrativos encontrados no localStorage, validando...');
      
      try {
        // Verificar se os dados do admin são válidos
        const adminData = JSON.parse(adminDataStr);
        if (!adminData || !adminData.email) {
          console.warn('Dados administrativos inválidos no localStorage');
          localStorage.removeItem(ADMIN_AUTH_KEY);
          localStorage.removeItem(ADMIN_DATA_KEY);
          setAdminSession(null);
          setAdminUser(null);
          setAdminLoading(false);
          return;
        }
        
        // Verificar se o usuário ainda existe na tabela admin_users
        const { data: adminUserData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', adminData.email)
          .eq('is_active', true)
          .single();
          
        if (adminError || !adminUserData) {
          console.warn('Usuário administrativo não encontrado ou inativo:', adminData.email);
          localStorage.removeItem(ADMIN_AUTH_KEY);
          localStorage.removeItem(ADMIN_DATA_KEY);
          setAdminSession(null);
          setAdminUser(null);
          setAdminLoading(false);
          return;
        }
        
        console.log('Sessão administrativa válida:', adminData.email);
        setAdminUser(adminUserData as AdminUser);
        
        // Verificar também a sessão do Supabase (opcional, apenas para validação)
        const { data: { session } } = await supabase.auth.getSession();
        setAdminSession(session);
        
      } catch (e) {
        console.error('Erro ao processar dados administrativos:', e);
        localStorage.removeItem(ADMIN_AUTH_KEY);
        localStorage.removeItem(ADMIN_DATA_KEY);
        setAdminSession(null);
        setAdminUser(null);
      }
    } catch (err) {
      console.error('Erro ao verificar sessão administrativa:', err);
      setAdminSession(null);
      setAdminUser(null);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Função para verificar se o usuário atual é um admin válido
  const verifyAdminStatus = useCallback(async () => {
    if (!adminUser) {
      console.log('Admin: Nenhum usuário administrativo encontrado');
      return false;
    }
    
    try {
      // Verificar se o usuário ainda existe na tabela admin_users
      const { data: adminUserData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', adminUser.email)
        .eq('is_active', true)
        .single();
        
      if (adminError || !adminUserData) {
        console.warn('Admin: Usuário administrativo não encontrado ou inativo:', adminUser.email);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar status administrativo:', error);
      return false;
    }
  }, [adminUser]);

  // Função de login específica para admin
  const adminLogin = async (email: string, password: string) => {
    console.log('Iniciando processo de login administrativo para:', email);
    try {
      setAdminLoading(true);
      
      // Primeiro fazer logout de qualquer sessão existente
      await supabase.auth.signOut();
      
      // Limpar dados administrativos anteriores
      localStorage.removeItem(ADMIN_AUTH_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
      
      // Tentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Verificar se é um admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
        
      if (adminError || !adminData) {
        await supabase.auth.signOut();
        throw new Error('Usuário não é um administrador ou está inativo');
      }
      
      // Salvar sessão administrativa no localStorage
      localStorage.setItem(ADMIN_AUTH_KEY, 'authenticated');
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData));
      
      setAdminSession(data.session);
      setAdminUser(adminData as AdminUser);
      
      toast({
        title: "Login administrativo bem-sucedido",
        description: `Bem-vindo, ${adminData.full_name || email}!`,
      });
      
      return { session: data.session, adminUser: adminData };
    } catch (error) {
      console.error('Erro no login administrativo:', error);
      
      toast({
        title: "Erro no login administrativo",
        description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setAdminLoading(false);
    }
  };
  
  // Função de logout específica para admin
  const adminLogout = async () => {
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
      await supabase.auth.signOut();
      setAdminSession(null);
      setAdminUser(null);
      
      toast({
        title: "Logout administrativo",
        description: "Você saiu do painel administrativo com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer logout administrativo:', error);
      
      toast({
        title: "Erro ao fazer logout",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar sair",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Inicialização isolada da sessão administrativa
    loadAdminSession();
    
    // Listener para mudanças de autenticação
    let authListener: { subscription: { unsubscribe: () => void } } | undefined;
    
    try {
      // Configurar o listener com tratamento de erros
      const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Evento de autenticação detectado (Admin):', event, session ? 'com sessão' : 'sem sessão');
        
        // Eventos que indicam mudança de sessão
        if (event === 'SIGNED_OUT') {
          console.log('Admin: Evento de logout detectado');
          // Limpar dados administrativos no logout
          localStorage.removeItem(ADMIN_AUTH_KEY);
          localStorage.removeItem(ADMIN_DATA_KEY);
          setAdminSession(null);
          setAdminUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('Admin: Evento de login ou refresh de token detectado');
          // Recarregar sessão administrativa
          loadAdminSession();
        } else if (event === 'INITIAL_SESSION') {
          console.log('Admin: Evento de sessão inicial detectado');
          // Sessão inicial carregada
          if (session) {
            console.log('Admin: Sessão inicial válida, verificando se é admin');
            loadAdminSession();
          }
        }
      });
      
      authListener = authSubscription.data;
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error);
      setInitError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
    
    return () => {
      try {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Erro ao remover listener de autenticação:', error);
      }
    };
  }, [loadAdminSession]);
  
  return {
    adminSession,
    adminUser,
    adminLoading,
    adminLogin,
    adminLogout,
    verifyAdminStatus,
    initError,
    isAdmin: !!adminUser
  };
};
