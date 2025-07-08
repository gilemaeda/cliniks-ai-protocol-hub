import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminContext, SystemSettings } from './AdminContext';

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const { 
    adminUser, 
    adminLoading, 
    isAdmin, 
    adminLogin, 
    adminLogout 
  } = useAdminAuth();
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [adminUsers, setAdminUsers] = useState<Array<import('@/hooks/useAdminAuth').AdminUser>>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  
  // Função para buscar configurações do sistema
  const refreshSettings = useCallback(async () => {
    if (!isAdmin) {
      console.log('AdminContext: Tentativa de buscar configurações sem autenticação administrativa');
      return;
    }
    
    try {
      console.log('AdminContext: Buscando configurações do sistema...');
      setSettingsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
        
      if (error) throw error;
      
      // Converter array em objeto para fácil acesso por chave
      interface SettingItem {
        key: string;
        value: string | number | boolean | null;
      }
      
      const settingsObj = data.reduce((acc: SystemSettings, item: SettingItem) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as SystemSettings);
      
      console.log(`AdminContext: ${data.length} configurações carregadas com sucesso`);
      setSystemSettings(settingsObj);
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error instanceof Error ? error.message : "Não foi possível carregar as configurações do sistema",
        variant: "destructive"
      });
    } finally {
      setSettingsLoading(false);
    }
  }, [isAdmin, toast]);
  
  // Função para buscar usuários administrativos
  const fetchAdminUsers = useCallback(async () => {
    if (!isAdmin) {
      console.warn('AdminContext: Tentativa de buscar administradores sem autenticação administrativa');
      return;
    }
    
    try {
      console.log('AdminContext: Buscando lista de administradores...');
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log(`AdminContext: ${data?.length || 0} administradores encontrados`);
      setAdminUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários administrativos:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error instanceof Error ? error.message : "Não foi possível carregar a lista de administradores",
        variant: "destructive"
      });
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin, toast]);
  
  // Função para salvar configurações do sistema
  const saveSettings = useCallback(async (key: string, value: string | number | boolean | null) => {
    if (!isAdmin) {
      console.warn('AdminContext: Tentativa de salvar configuração sem autenticação administrativa');
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para alterar configurações do sistema",
        variant: "destructive"
      });
      return {};
    }
    
    try {
      console.log(`AdminContext: Salvando configuração ${key}=${value}...`);
      
      // Usar a Edge Function para salvar configurações
      // Isso evita problemas de RLS e garante validação adequada
      const { data, error } = await supabase.functions.invoke('manage-system-settings', {
        body: { action: 'update', key, value }
      });
      
      if (error) throw error;
      
      // Atualizar estado local
      setSystemSettings((prev: SystemSettings | null) => {
        if (!prev) return { [key]: value };
        return {
          ...prev,
          [key]: value
        };
      });
      
      console.log(`AdminContext: Configuração ${key} salva com sucesso`);
      
      toast({
        title: "Configuração salva",
        description: `A configuração "${key}" foi atualizada com sucesso`
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: error instanceof Error ? error.message : `Não foi possível salvar a configuração "${key}"`,
        variant: "destructive"
      });
      throw error;
    }
  }, [isAdmin, toast]);
  
  // Carregar configurações do sistema quando o admin estiver autenticado
  useEffect(() => {
    if (isAdmin) {
      // Carregar configurações e usuários quando o contexto for inicializado
      // e o usuário estiver autenticado como admin
      console.log('AdminContext: Inicializando dados administrativos...');
      refreshSettings();
      fetchAdminUsers();
    }
  }, [isAdmin, refreshSettings, fetchAdminUsers]);
  
  // Verificar se é admin master
  const isMasterAdmin = adminUser?.is_master || false;
  
  return (
    <AdminContext.Provider
      value={{
        adminUser,
        adminLoading,
        isAdmin,
        isMasterAdmin,
        adminLogin,
        adminLogout,
        systemSettings,
        settingsLoading,
        refreshSettings,
        saveSettings,
        adminUsers,
        usersLoading,
        fetchAdminUsers
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
