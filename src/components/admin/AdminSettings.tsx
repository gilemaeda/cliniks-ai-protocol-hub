
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, UserPlus, Trash2, Eye, EyeOff, Shield, AlertTriangle, Loader2, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useSessionSync } from '@/hooks/useSessionSync';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_master: boolean;
  is_active: boolean;
  created_at: string;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    full_name: '',
    is_master: false
  });
  
  // Estados para configuração do webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  // Referência para controlar se o componente está montado
  const isMounted = useRef(true);
  
  // Função para verificar a sessão atual
  const checkSession = useCallback(async () => {
    try {
      // Verificar autenticação administrativa usando localStorage
      // (mesma lógica usada no ProtectedAdminRoute)
      const adminAuth = localStorage.getItem('cliniks_admin_auth');
      const adminDataStr = localStorage.getItem('cliniks_admin_data');
      
      if (adminAuth !== 'authenticated' || !adminDataStr) {
        console.warn('Sessão administrativa não encontrada ou expirada');
        return false;
      }
      
      // Verificar se os dados do admin são válidos
      try {
        const adminData = JSON.parse(adminDataStr);
        if (!adminData || !adminData.email) {
          console.warn('Dados administrativos inválidos');
          return false;
        }
        console.log('Sessão administrativa válida:', adminData.email);
        return true;
      } catch (e) {
        console.error('Erro ao processar dados administrativos:', e);
        return false;
      }
    } catch (err) {
      console.error('Erro ao verificar sessão administrativa:', err);
      return false;
    }
  }, []);
  
  // Sincronização de sessão entre abas
  useSessionSync(() => {
    console.log('Mudança de sessão detectada, recarregando dados...');
    if (isMounted.current) {
      fetchWebhookConfig();
    }
  });
  
  // Função para buscar a configuração do webhook do n8n diretamente da tabela
  const fetchWebhookConfig = useCallback(async () => {
    setWebhookLoading(true);
    try {
      // Verificar autenticação administrativa usando localStorage
      const adminAuth = localStorage.getItem('cliniks_admin_auth');
      const adminDataStr = localStorage.getItem('cliniks_admin_data');
      
      if (adminAuth !== 'authenticated' || !adminDataStr) {
        throw new Error('Sessão administrativa inválida ou expirada');
      }
      
      // Verificar se os dados do admin são válidos
      const adminData = JSON.parse(adminDataStr);
      if (!adminData || !adminData.email) {
        throw new Error('Dados administrativos inválidos');
      }
      
      // Verificar se o email é gilemaeda@gmail.com (admin master) ou um admin válido
      if (adminData.email === "gilemaeda@gmail.com" || adminData.is_master) {
        // É o admin master, continuar
        console.log("Admin master verificado:", adminData.email);
      } else {
        console.log("Admin não é master, mas está autenticado:", adminData.email);
      }
      
      // Buscar configuração diretamente da tabela
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "n8n_webhook_url")
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Erro ao buscar configuração');
      }
      
      // Se encontrou a configuração, use-a
      if (data) {
        setWebhookUrl(data.value || '');
      } else {
        // Se não encontrou, crie a configuração com valor vazio
        console.log('Registro de webhook não encontrado, criando...');
        
        const { error: insertError } = await supabase
          .from("system_settings")
          .insert({
            key: "n8n_webhook_url",
            value: "",
            description: "Configuração para n8n_webhook_url"
          });
        
        if (insertError) {
          console.error('Erro ao criar registro de webhook:', insertError.message);
          throw new Error(insertError.message || 'Erro ao criar configuração');
        }
        
        setWebhookUrl('');
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do webhook:', error);
      toast({
        title: "Erro ao carregar configuração do webhook",
        description: error instanceof Error ? error.message : "Não foi possível carregar a configuração do webhook do n8n",
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  }, [toast]);

  // Função para salvar a configuração do webhook
  const saveWebhookConfig = useCallback(async () => {
    // Verificar sessão antes de salvar
    const sessionValid = await checkSession();
    if (!sessionValid) {
      toast({
        title: "Sessão expirada",
        description: "Sua sessão expirou ou é inválida. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    if (!webhookUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida para o webhook",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Verificar se o usuário atual é admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Sessão inválida ou expirada');
      }
      
      // Verificar se o email é gilemaeda@gmail.com (admin master)
      if (user.email === "gilemaeda@gmail.com") {
        // É o admin master, continuar
        console.log("Admin master verificado:", user.email);
      } else {
        console.log("Verificando se é admin na tabela admin_users:", user.email);
        // Para outros usuários, verificar na tabela admin_users
        try {
          const { data: adminData, error: adminError } = await supabase
            .from("admin_users")
            .select()
            .eq("email", user.email);

          console.log("Resultado da consulta admin_users:", { adminData, adminError });

          if (adminError) {
            console.error("Erro ao verificar admin:", adminError);
            throw new Error('Erro ao verificar permissões de administrador');
          }

          if (!adminData || adminData.length === 0) {
            throw new Error('Usuário não é um administrador');
          }
        } catch (err) {
          console.error("Erro na verificação de admin:", err);
          throw new Error('Erro ao verificar permissões de administrador');
        }
      }
      
      // Verificar se a configuração já existe
      const { data: existingData, error: checkError } = await supabase
        .from("system_settings")
        .select("id")
        .eq("key", "n8n_webhook_url")
        .maybeSingle();

      let result;
      
      if (existingData) {
        // Atualizar configuração existente
        result = await supabase
          .from("system_settings")
          .update({ value: webhookUrl })
          .eq("key", "n8n_webhook_url");
      } else {
        // Criar nova configuração
        result = await supabase
          .from("system_settings")
          .insert({
            key: "n8n_webhook_url",
            value: webhookUrl,
            description: `Configuração para n8n_webhook_url`
          });
      }

      if (result.error) {
        throw new Error(result.error.message || 'Erro ao salvar configuração');
      }
      
      toast({
        title: "Configuração salva",
        description: "A URL do webhook foi salva com sucesso",
        variant: "default"
      });
      
      setIsWebhookDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar configuração do webhook:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: error instanceof Error ? error.message : "Não foi possível salvar a configuração do webhook",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [webhookUrl, toast, setIsWebhookDialogOpen, checkSession]);

  // Função para buscar administradores
  const fetchAdminUsers = useCallback(async () => {
    try {
      // Verificar sessão antes de buscar dados
      const sessionValid = await checkSession();
      if (!sessionValid) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou ou é inválida. Por favor, faça login novamente.",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAdminUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar administradores:', error);
      toast({
        title: "Erro ao carregar administradores",
        description: "Não foi possível carregar a lista de administradores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, checkSession]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    // Definir função para buscar administradores dentro do useEffect
    // para evitar problemas de escopo e hot reload
    const loadAdminUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setAdminUsers(data || []);
      } catch (error) {
        console.error('Erro ao buscar administradores:', error);
        toast({
          title: "Erro ao carregar administradores",
          description: "Não foi possível carregar a lista de administradores",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    // Verificar sessão antes de carregar dados
    const initializeData = async () => {
      const sessionValid = await checkSession();
      if (sessionValid) {
        fetchWebhookConfig();
        loadAdminUsers();
      } else {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou ou é inválida. Por favor, faça login novamente.",
          variant: "destructive"
        });
      }
    };
    
    initializeData();
    
    // Cleanup quando o componente for desmontado
    return () => {
      isMounted.current = false;
    };
  }, [fetchWebhookConfig, checkSession, toast]);

  const createAdmin = async () => {
    try {
      if (!newAdmin.email || !newAdmin.password || !newAdmin.full_name) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      // Hash da senha (em produção, isso deveria ser feito no backend)
      const passwordHash = await hashPassword(newAdmin.password);

      const { error } = await supabase
        .from('admin_users')
        .insert({
          email: newAdmin.email,
          password_hash: passwordHash,
          full_name: newAdmin.full_name,
          is_master: newAdmin.is_master,
          is_active: true
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Administrador criado!",
        description: "Novo administrador foi criado com sucesso."
      });

      setNewAdmin({ email: '', password: '', full_name: '', is_master: false });
      setShowCreateForm(false);
      fetchAdminUsers();
    } catch (error) {
      console.error('Erro ao criar administrador:', error);
      toast({
        title: "Erro ao criar administrador",
        description: "Não foi possível criar o administrador",
        variant: "destructive"
      });
    }
  };

  const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Status atualizado!",
        description: `Administrador ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`
      });

      fetchAdminUsers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do administrador",
        variant: "destructive"
      });
    }
  };

  const deleteAdmin = async (id: string, email: string) => {
    try {
      // Não permitir excluir o admin master principal
      if (email === 'admin@cliniks.com.br') {
        toast({
          title: "Ação não permitida",
          description: "Não é possível excluir o administrador master principal",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Administrador excluído!",
        description: "Administrador foi removido com sucesso."
      });

      fetchAdminUsers();
    } catch (error) {
      console.error('Erro ao excluir administrador:', error);
      toast({
        title: "Erro ao excluir administrador",
        description: "Não foi possível excluir o administrador",
        variant: "destructive"
      });
    }
  };

  // Função simples de hash (em produção, usar bcrypt no backend)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações Administrativas
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie administradores e configurações gerais da plataforma
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> As credenciais temporárias (admin@cliniks.com.br) devem ser alteradas após o primeiro acesso. 
          Crie um novo administrador master e desative as credenciais padrão.
        </AlertDescription>
      </Alert>

      {/* Gerenciamento de Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Administradores da Plataforma</span>
            </span>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Administrador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Administrador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Nome Completo
                    </label>
                    <Input
                      placeholder="Nome do administrador"
                      value={newAdmin.full_name}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha segura"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newAdmin.is_master}
                      onCheckedChange={(checked) => setNewAdmin(prev => ({ ...prev, is_master: checked }))}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Administrador Master (acesso total)
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createAdmin}>
                      Criar Administrador
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminUsers.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {admin.full_name}
                    </h4>
                    {admin.is_master && (
                      <Badge variant="secondary" className="bg-red-500 text-white">
                        Master
                      </Badge>
                    )}
                    {admin.email === 'admin@cliniks.com.br' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Temporário
                      </Badge>
                    )}
                    <Badge variant={admin.is_active ? "default" : "secondary"}>
                      {admin.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {admin.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Criado em: {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Switch
                    checked={admin.is_active}
                    onCheckedChange={() => toggleAdminStatus(admin.id, admin.is_active)}
                  />
                  {admin.email !== 'admin@cliniks.com.br' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAdmin(admin.id, admin.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configurações Gerais da Plataforma</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Seção de Webhook do n8n */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium">Webhook do n8n</h4>
                  <p className="text-sm text-gray-500">
                    Configure a URL do webhook do n8n para integração com o sistema.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsWebhookDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configurar</span>
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <div className="flex items-center">
                  <Link className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-mono truncate">
                    {webhookUrl ? webhookUrl : "Nenhuma URL configurada"}
                  </span>
                </div>
              </div>
            </div>

            {/* Outras configurações futuras */}
            <div className="border rounded-lg p-4 text-center text-gray-500">
              <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Mais configurações em desenvolvimento...</p>
              <p className="text-xs mt-1">
                Em breve: configurações de marca, notificações, backup e mais.
              </p>
            </div>
          </div>

          {/* Dialog para configurar webhook do n8n */}
          <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Webhook do n8n</DialogTitle>
                <DialogDescription>
                  Configure a URL do webhook do n8n para integração com o sistema.
                  Esta URL será usada para enviar notificações sobre eventos de assinatura.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="webhookUrl" className="text-right">
                    URL do Webhook
                  </Label>
                  <Input
                    id="webhookUrl"
                    className="col-span-3"
                    placeholder="https://seu-servidor-n8n.com/webhook/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                
                {/* Botão de teste do webhook */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Testar</span>
                  </div>
                  <div className="col-span-3">
                    <Button 
                      variant="outline" 
                      onClick={testWebhook} 
                      disabled={testingWebhook || !webhookUrl}
                      className="w-full"
                    >
                      {testingWebhook ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>Testar Webhook</>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Resultado do teste */}
                {testResult && (
                  <div className="col-span-4">
                    <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center">
                        {testResult.success ? (
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {testResult.message}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Sobre o Webhook do n8n</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                  <li>O webhook será acionado automaticamente quando uma clínica contratar um plano ou quando o status da assinatura mudar.</li>
                  <li>Dados enviados no webhook: ID da clínica, nome da clínica, ID da assinatura, status da assinatura, data de vencimento e informações do proprietário.</li>
                  <li>Use o n8n para automatizar ações como envio de e-mails de boas-vindas, lembretes de pagamento ou notificações de expiração.</li>
                  <li>A URL deve apontar para um endpoint válido do n8n configurado para receber webhooks.</li>
                  <li><strong>Teste do webhook:</strong> Envia uma requisição de teste para verificar se o endpoint está configurado corretamente e respondendo.</li>
                </ul>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsWebhookDialogOpen(false)}
                  disabled={webhookLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveWebhookConfig}
                  disabled={webhookLoading}
                >
                  {webhookLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configuração"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
