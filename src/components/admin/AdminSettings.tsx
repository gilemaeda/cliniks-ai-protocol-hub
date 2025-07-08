
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
import { useAdminAuth, AdminUser } from '@/hooks/useAdminAuth';

const AdminSettings = () => {
  const { toast } = useToast();
  const { isAdmin, adminUser, adminLoading } = useAdminAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', full_name: '', is_master: false });
  
  // Estados para configuração do webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [registrationWebhookUrl, setRegistrationWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  const isMounted = useRef(true);

  useSessionSync(() => {
    if (isMounted.current) {
      fetchWebhookConfig();
      fetchAdminUsers();
    }
  });
  
  const testWebhook = useCallback(async () => {
    if (!isAdmin) {
      toast({ title: "Não autorizado", variant: "destructive" });
      return;
    }
    if (!webhookUrl || !webhookUrl.trim()) {
      toast({ title: "URL não definida", description: "Insira uma URL para testar.", variant: "destructive" });
      return;
    }
    
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: { 
          webhookUrl: webhookUrl,
          payload: { test: true, timestamp: new Date().toISOString() }
        }
      });

      if (error) throw new Error(error.message);
      setTestResult({ success: data.success, message: data.message || 'Falha no teste.' });

    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Erro desconhecido.' });
    } finally {
      setTestingWebhook(false);
    }
  }, [isAdmin, webhookUrl, toast]);

  const fetchWebhookConfig = useCallback(async () => {
    setWebhookLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['n8n_webhook_url', 'n8n_registration_webhook_url']);

      if (error) throw error;

      if (data && isMounted.current) {
        setWebhookUrl(data.find(s => s.key === 'n8n_webhook_url')?.value || '');
        setRegistrationWebhookUrl(data.find(s => s.key === 'n8n_registration_webhook_url')?.value || '');
      }
    } catch (error) {
      console.error('Erro ao buscar configs de webhook:', error);
      toast({ title: "Erro ao carregar webhooks", variant: "destructive" });
    } finally {
      if(isMounted.current) setWebhookLoading(false);
    }
  }, [toast]);

  const saveWebhookConfig = useCallback(async () => {
    if (!isAdmin) {
      toast({ title: "Não autorizado", variant: "destructive" });
      return;
    }
    if (!webhookUrl.trim() || !registrationWebhookUrl.trim()) {
      toast({ title: "URLs inválidas", description: "Insira URLs válidas para os webhooks.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'n8n_webhook_url', value: webhookUrl },
        { key: 'n8n_registration_webhook_url', value: registrationWebhookUrl },
      ];

      const { data, error } = await supabase.functions.invoke('manage-system-settings', {
        body: { action: 'set-batch', settings: settingsToSave }
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      toast({ title: "Configurações salvas!" });
      setIsWebhookDialogOpen(false);

    } catch (error) {
      console.error('Erro ao salvar config de webhook:', error);
      toast({ title: "Erro ao salvar", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [isAdmin, webhookUrl, registrationWebhookUrl, toast]);

  const fetchAdminUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (isMounted.current) setAdminUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar admins:', error);
      toast({ title: "Erro ao carregar admins", variant: "destructive" });
    } finally {
      if(isMounted.current) setLoading(false);
    }
  }, [isAdmin, toast]);
  
  useEffect(() => {
    if (isAdmin) {
      fetchWebhookConfig();
      fetchAdminUsers();
    }
  }, [isAdmin, fetchWebhookConfig, fetchAdminUsers]);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  // Funções de admin (create, toggle, delete) omitidas para brevidade, mas devem ser mantidas
  const createAdmin = useCallback(async () => { /* ... */ }, [/* ... */]);
  const toggleAdminStatus = useCallback(async (id: string, currentStatus: boolean) => { /* ... */ }, [/* ... */]);
  const deleteAdmin = useCallback(async (id: string, email: string) => { /* ... */ }, [/* ... */]);

  if (adminLoading) {
    return <div className="text-center py-12"><Loader2 className="h-12 w-12 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">Configurações Administrativas</h3>
        <p className="text-muted-foreground">Gerencie administradores e configurações da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2"><Settings className="h-5 w-5" /><span>Configurações Gerais</span></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium">Webhooks de Integração (n8n)</h4>
                <p className="text-sm text-muted-foreground">URLs para notificar eventos de assinaturas e cadastros.</p>
              </div>
              <Button variant="outline" onClick={() => setIsWebhookDialogOpen(true)} className="flex items-center gap-2"><Settings className="h-4 w-4" /><span>Configurar</span></Button>
            </div>
            <div className="space-y-2 bg-muted p-3 rounded-md">
              <div className="flex items-center"><Link className="h-4 w-4 mr-2 text-primary flex-shrink-0" /><span className="text-sm font-semibold mr-2">Assinaturas:</span><span className="text-sm font-mono truncate">{webhookUrl || "Nenhuma URL configurada"}</span></div>
              <div className="flex items-center"><Link className="h-4 w-4 mr-2 text-primary flex-shrink-0" /><span className="text-sm font-semibold mr-2">Cadastro:</span><span className="text-sm font-mono truncate">{registrationWebhookUrl || "Nenhuma URL configurada"}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Webhooks</DialogTitle>
            <DialogDescription>Insira as URLs dos webhooks para integração com o n8n.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="webhookUrl" className="text-right">Webhook Assinaturas</Label>
              <Input id="webhookUrl" className="col-span-3" placeholder="URL para eventos de assinatura..." value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="registration-webhook-url" className="text-right">Webhook Cadastro</Label>
              <Input id="registration-webhook-url" className="col-span-3" placeholder="URL para novos cadastros de clínica..." value={registrationWebhookUrl} onChange={(e) => setRegistrationWebhookUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right"><span className="text-sm text-muted-foreground">Testar Assinatura</span></div>
              <div className="col-span-3">
                <Button variant="outline" onClick={testWebhook} disabled={testingWebhook || !webhookUrl.trim()} className="w-full">
                  {testingWebhook ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testando...</> : <>Testar Webhook</>}
                </Button>
              </div>
            </div>
            {testResult && (
              <div className="col-span-4">
                <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                  <p className={`text-sm font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWebhookDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveWebhookConfig} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar Configurações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manter o restante do componente para gerenciar admins */}
    </div>
  );
};

export default AdminSettings;
