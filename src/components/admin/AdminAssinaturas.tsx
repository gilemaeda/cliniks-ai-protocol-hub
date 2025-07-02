import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, RefreshCcw, CheckCircle, XCircle, MoreHorizontal, Trash2, Calendar, CalendarClock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subscription {
  id: string;
  clinic_id: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  plan_name: string;
  status: string;
  billing_type: string;
  value: number;
  next_due_date: string;
  cycle: string;
  created_at: string;
  updated_at: string;
  clinics: {
    name: string;
    cnpj: string;
    profiles: {
      full_name: string;
      email: string;
    } | null;
  } | null;
}

const AdminAssinaturas = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  // Estados para controlar os diálogos
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMonthsDialogOpen, setIsAddMonthsDialogOpen] = useState(false);
  const [isAddTrialDialogOpen, setIsAddTrialDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [monthsToAdd, setMonthsToAdd] = useState(1);
  const [daysToAdd, setDaysToAdd] = useState(7);
  const [actionLoading, setActionLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clinics (
            name,
            cnpj,
            profiles (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSubscriptions(data || []);
      setFilteredSubscriptions(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: "Erro ao carregar assinaturas",
        description: "Não foi possível carregar os dados das assinaturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Função para buscar a configuração do webhook do n8n
  const fetchWebhookConfig = useCallback(async () => {
    setWebhookLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'n8n_webhook_url')
        .single();

      if (error) throw error;
      
      setWebhookUrl(data?.value || '');
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

  useEffect(() => {
    fetchSubscriptions();
    fetchWebhookConfig();
  }, [fetchSubscriptions, fetchWebhookConfig]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSubscriptions(subscriptions);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = subscriptions.filter(sub => 
        sub.clinics?.name?.toLowerCase().includes(lowercasedSearch) ||
        sub.clinics?.cnpj?.includes(lowercasedSearch) ||
        sub.clinics?.profiles?.full_name?.toLowerCase().includes(lowercasedSearch) ||
        sub.clinics?.profiles?.email?.toLowerCase().includes(lowercasedSearch) ||
        sub.status.toLowerCase().includes(lowercasedSearch) ||
        sub.plan_name.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredSubscriptions(filtered);
    }
  }, [searchTerm, subscriptions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativa
        </span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
          Pendente
        </span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Atrasada
        </span>;
      case 'canceled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Cancelada
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
          {status}
        </span>;
    }
  };

  const getBillingTypeText = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'BOLETO':
        return 'Boleto';
      case 'PIX':
        return 'PIX';
      default:
        return type;
    }
  };

  const getCycleText = (cycle: string) => {
    switch (cycle) {
      case 'MONTHLY':
        return 'Mensal';
      case 'YEARLY':
        return 'Anual';
      default:
        return cycle;
    }
  };

  // Função para excluir uma assinatura
  const handleDeleteSubscription = async () => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      // 1. Excluir a assinatura no Supabase
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      // 2. Atualizar a lista de assinaturas
      setSubscriptions(subscriptions.filter(sub => sub.id !== selectedSubscription.id));
      setFilteredSubscriptions(filteredSubscriptions.filter(sub => sub.id !== selectedSubscription.id));
      
      toast({
        title: "Assinatura excluída",
        description: `A assinatura da clínica ${selectedSubscription.clinics?.name} foi excluída com sucesso.`,
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error);
      toast({
        title: "Erro ao excluir assinatura",
        description: "Não foi possível excluir a assinatura. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Função para adicionar meses ao plano ativo
  const handleAddActivePlanMonths = async () => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      // Calcular nova data de vencimento
      const currentDueDate = new Date(selectedSubscription.next_due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setMonth(newDueDate.getMonth() + monthsToAdd);
      
      // Atualizar a assinatura no Supabase
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          next_due_date: newDueDate.toISOString(),
          status: 'active' // Garantir que o status seja ativo
        })
        .eq('id', selectedSubscription.id)
        .select();

      if (error) throw error;

      // Atualizar a lista de assinaturas
      const updatedSubscriptions = subscriptions.map(sub => {
        if (sub.id === selectedSubscription.id && data[0]) {
          return { ...sub, ...data[0] };
        }
        return sub;
      });
      
      setSubscriptions(updatedSubscriptions);
      setFilteredSubscriptions(updatedSubscriptions.filter(sub => 
        searchTerm.trim() === '' || 
        sub.clinics?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.clinics?.cnpj?.includes(searchTerm) ||
        sub.clinics?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.clinics?.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      toast({
        title: "Plano ativo estendido",
        description: `${monthsToAdd} ${monthsToAdd === 1 ? 'mês adicionado' : 'meses adicionados'} ao plano da clínica ${selectedSubscription.clinics?.name}.`,
      });
      
      setIsAddMonthsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar meses ao plano:', error);
      toast({
        title: "Erro ao estender plano",
        description: "Não foi possível adicionar meses ao plano. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Função para adicionar dias de teste
  const handleAddTrialDays = async () => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      // Calcular nova data de vencimento
      const currentDueDate = new Date(selectedSubscription.next_due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + daysToAdd);
      
      // Atualizar a assinatura no Supabase
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          next_due_date: newDueDate.toISOString(),
          status: 'active', // Garantir que o status seja ativo
          plan_name: 'Teste' // Alterar o nome do plano para indicar que é um período de teste
        })
        .eq('id', selectedSubscription.id)
        .select();

      if (error) throw error;

      // Atualizar a lista de assinaturas
      const updatedSubscriptions = subscriptions.map(sub => {
        if (sub.id === selectedSubscription.id && data[0]) {
          return { ...sub, ...data[0] };
        }
        return sub;
      });
      
      setSubscriptions(updatedSubscriptions);
      setFilteredSubscriptions(updatedSubscriptions.filter(sub => 
        searchTerm.trim() === '' || 
        sub.clinics?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.clinics?.cnpj?.includes(searchTerm) ||
        sub.clinics?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.clinics?.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      toast({
        title: "Período de teste estendido",
        description: `${daysToAdd} ${daysToAdd === 1 ? 'dia adicionado' : 'dias adicionados'} ao período de teste da clínica ${selectedSubscription.clinics?.name}.`,
      });
      
      setIsAddTrialDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar dias de teste:', error);
      toast({
        title: "Erro ao estender período de teste",
        description: "Não foi possível adicionar dias ao período de teste. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciamento de Assinaturas</CardTitle>
            <Button
              variant="outline"
              onClick={() => setIsWebhookDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <span>Configurar Webhook n8n</span>
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSubscriptions}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por clínica, CNPJ, proprietário, email ou status..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Carregando assinaturas...</span>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma assinatura encontrada
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clínica</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próximo Vencimento</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.clinics?.name || 'N/A'}
                        <div className="text-xs text-gray-500">
                          {subscription.clinics?.cnpj || 'CNPJ não informado'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.clinics?.profiles?.full_name || 'N/A'}
                        <div className="text-xs text-gray-500">
                          {subscription.clinics?.profiles?.email || 'Email não informado'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.plan_name}
                        <div className="text-xs text-gray-500">
                          {getCycleText(subscription.cycle)}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(subscription.value)}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>{formatDate(subscription.next_due_date)}</TableCell>
                      <TableCell>{getBillingTypeText(subscription.billing_type)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setIsManageDialogOpen(true);
                          }}
                        >
                          Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    
      {/* Dialog principal de gerenciamento */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Assinatura</DialogTitle>
            <DialogDescription>
              Escolha uma ação para a assinatura da clínica {selectedSubscription?.clinics?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => {
                setIsManageDialogOpen(false);
                setIsAddMonthsDialogOpen(true);
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Adicionar meses de plano ativo
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => {
                setIsManageDialogOpen(false);
                setIsAddTrialDialogOpen(true);
              }}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Adicionar dias de teste
            </Button>
            <Button
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
              variant="outline"
              onClick={() => {
                setIsManageDialogOpen(false);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir assinatura
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsManageDialogOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão de assinatura */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a assinatura da clínica {selectedSubscription?.clinics?.name}?
              Esta ação não pode ser desfeita e removerá o acesso ao plano ativo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar meses ao plano ativo */}
      <Dialog open={isAddMonthsDialogOpen} onOpenChange={setIsAddMonthsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Meses ao Plano Ativo</DialogTitle>
            <DialogDescription>
              Adicione meses de plano ativo para a clínica {selectedSubscription?.clinics?.name}.
              A data de vencimento será estendida e o status da assinatura será definido como ativo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="months" className="text-right">
                Meses
              </Label>
              <Select
                value={monthsToAdd.toString()}
                onValueChange={(value) => setMonthsToAdd(parseInt(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a quantidade de meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mês</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMonthsDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddActivePlanMonths}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Meses"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar dias de teste */}
      <Dialog open={isAddTrialDialogOpen} onOpenChange={setIsAddTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Dias de Teste</DialogTitle>
            <DialogDescription>
              Adicione dias ao período de teste para a clínica {selectedSubscription?.clinics?.name}.
              A data de vencimento será estendida e o plano será definido como "Teste".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right">
                Dias
              </Label>
              <Select
                value={daysToAdd.toString()}
                onValueChange={(value) => setDaysToAdd(parseInt(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a quantidade de dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTrialDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddTrialDays}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Dias"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
    </div>
  );
};

export default AdminAssinaturas;
