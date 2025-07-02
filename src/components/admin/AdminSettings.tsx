
import { useState, useEffect, useCallback } from 'react';
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
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);

  // Função para buscar a configuração do webhook do n8n
  const fetchWebhookConfig = useCallback(async () => {
    setWebhookLoading(true);
    try {
      // Buscar todos os registros e filtrar pelo key no código
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'n8n_webhook_url');

      if (error) throw error;
      
      // Se encontrou algum registro, use o primeiro
      if (data && data.length > 0) {
        setWebhookUrl(data[0].value || '');
      } else {
        // Se não encontrou, crie o registro
        console.log('Registro de webhook não encontrado, criando...');
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert({
            key: 'n8n_webhook_url',
            value: '',
            description: 'URL do webhook do n8n para integração com o sistema'
          });
          
        if (insertError) {
          console.error('Erro ao criar registro de webhook:', insertError);
          throw insertError;
        }
        
        setWebhookUrl('');
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do webhook:', error);
      toast({
        title: "Erro ao carregar configuração do webhook",
        description: "Não foi possível carregar a configuração do webhook do n8n",
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  }, [toast]);

  // Função para salvar a configuração do webhook do n8n
  const saveWebhookConfig = async () => {
    setWebhookLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: webhookUrl })
        .eq('key', 'n8n_webhook_url');

      if (error) throw error;
      
      toast({
        title: "Configuração salva",
        description: "A URL do webhook do n8n foi atualizada com sucesso",
        variant: "default"
      });
      
      setIsWebhookDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar configuração do webhook:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: "Não foi possível salvar a configuração do webhook do n8n",
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  // Função para buscar administradores
  const fetchAdminUsers = useCallback(async () => {
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
  }, [toast]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchAdminUsers();
    fetchWebhookConfig();
  }, [fetchAdminUsers, fetchWebhookConfig]);

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
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Sobre o Webhook do n8n</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                  <li>O webhook será acionado automaticamente quando uma clínica contratar um plano ou quando o status da assinatura mudar.</li>
                  <li>Dados enviados no webhook: ID da clínica, nome da clínica, ID da assinatura, status da assinatura, data de vencimento e informações do proprietário.</li>
                  <li>Use o n8n para automatizar ações como envio de e-mails de boas-vindas, lembretes de pagamento ou notificações de expiração.</li>
                  <li>A URL deve apontar para um endpoint válido do n8n configurado para receber webhooks.</li>
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
