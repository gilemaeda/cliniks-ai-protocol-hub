import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useClinic } from '@/hooks/useClinic';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, AlertTriangle, CreditCard, Calendar, DollarSign, RefreshCw, Trash2, Loader2, AlertCircle, ArrowUpCircle } from 'lucide-react';

// Componentes do Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// --- Tipos e Interfaces ---
interface Plan {
  name: string;
  price: number;
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
  features: string[];
  recommended?: boolean;
  discount?: number;
}

interface Subscription {
  id: string;
  clinic_id: string;
  asaas_subscription_id: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'CANCELED' | 'EXPIRED';
  plan_name: string;
  value: number;
  cycle: 'MONTHLY' | 'YEARLY';
  billing_type: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  created_at: string;
  updated_at: string;
  next_due_date?: string;
  asaas_data?: Record<string, unknown> & { value?: number };
  latest_payment?: Record<string, unknown> & { paymentDate?: string; status?: string };
}

// --- Funções Auxiliares ---
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';

// --- Lógica de Fetching ---
const fetchSubscription = async (clinicId: string): Promise<Subscription | null> => {
  if (!clinicId) return null;
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar assinatura:', error);
    throw new Error('Não foi possível buscar os dados da sua assinatura.');
  }
  return data as Subscription | null;
};

// --- Componente Principal ---
export const Assinaturas: React.FC = () => {
  const { clinic, refetchClinic, planStatus } = useClinic();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Subscription['billing_type']>('BOLETO');

  const { data: subscription, isLoading: isSubscriptionLoading, isError, refetch } = useQuery<Subscription | null>({
    queryKey: ['subscription', clinic?.id],
    queryFn: () => fetchSubscription(clinic!.id),
    enabled: !!clinic,
    refetchInterval: (query) => {
      return query.state.data?.status === 'PENDING' ? 5000 : false;
    },
  });

  useEffect(() => {
    if (isError) {
      toast({ title: 'Erro ao carregar assinatura', description: 'Não foi possível buscar os dados.', variant: 'destructive' });
    }
  }, [isError, toast]);

  const plans: Plan[] = [
    { name: 'Mensal', price: 5.00, cycle: 'MONTHLY', description: 'Acesso completo para sua clínica.', features: ['Gestão de Protocolos', 'Avaliações com IA', 'Suporte Prioritário'] },
    { name: 'Anual', price: 238.80, cycle: 'YEARLY', description: 'Economize com o plano anual.', features: ['Todos os benefícios do plano mensal', 'Dois meses de desconto'], recommended: true, discount: 17 },
  ];

  const handleMutationSuccess = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['subscription', clinic?.id] });
    await refetchClinic();
  }, [queryClient, clinic, refetchClinic]);

  const createSubscription = useCallback(async () => {
    if (!clinic || !selectedPlan) return;
    setIsCreating(true);
    try {
      const { error } = await supabase.functions.invoke('create-subscription', {
        body: { clinic_id: clinic.id, plan_name: selectedPlan.name, value: selectedPlan.price, cycle: selectedPlan.cycle, billing_type: selectedPaymentMethod, description: `Plano ${selectedPlan.name}` },
      });
      if (error) throw error;
      await handleMutationSuccess();
      setDialogOpen(false);
      toast({ title: 'Redirecionando para pagamento...' });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erro ao criar assinatura:', error);
      toast({ title: 'Erro ao criar assinatura', description: error.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  }, [clinic, selectedPlan, selectedPaymentMethod, toast, handleMutationSuccess]);

  const cancelSubscription = useCallback(async () => {
    if (!subscription?.asaas_subscription_id) return;
    setIsCanceling(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', { body: { subscription_id: subscription.asaas_subscription_id } });
      if (error) throw error;
      await handleMutationSuccess();
      toast({ title: 'Assinatura cancelada com sucesso' });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erro ao cancelar assinatura:', error);
      toast({ title: 'Erro ao cancelar', description: error.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsCanceling(false);
    }
  }, [subscription, toast, handleMutationSuccess]);



  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleUpgrade = () => {
    const annualPlan = plans.find(p => p.cycle === 'YEARLY');
    if (annualPlan) handleSelectPlan(annualPlan);
  };

  const getStatusBadge = (status: string | undefined, type: 'subscription' | 'payment') => {
    const statusMap = {
      subscription: { ACTIVE: { label: 'Ativo', color: 'bg-green-500' }, PENDING: { label: 'Pendente', color: 'bg-yellow-500' }, INACTIVE: { label: 'Inativo', color: 'bg-red-500' }, CANCELED: { label: 'Cancelado', color: 'bg-gray-500' }, EXPIRED: { label: 'Expirado', color: 'bg-orange-500' }, TRIAL: { label: 'Em Teste', color: 'bg-blue-500' } },
      payment: { CONFIRMED: { label: 'Confirmado', color: 'bg-green-500' }, RECEIVED: { label: 'Recebido', color: 'bg-green-500' }, PENDING: { label: 'Pendente', color: 'bg-yellow-500' }, OVERDUE: { label: 'Atrasado', color: 'bg-orange-500' }, REFUNDED: { label: 'Reembolsado', color: 'bg-purple-500' }, FAILED: { label: 'Falhou', color: 'bg-red-500' } },
    };
    const config = statusMap[type][status?.toUpperCase() as keyof typeof statusMap[typeof type]] || { label: status || 'Desconhecido', color: 'bg-gray-400' };
    return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
  };

  const renderPlanCard = (plan: Plan) => (
    <Card key={plan.name} className={cn('flex flex-col', plan.recommended && 'border-2 border-blue-500')}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-3xl font-bold">{formatCurrency(plan.price)}<span className="text-sm font-normal">/{plan.cycle === 'MONTHLY' ? 'mês' : 'ano'}</span></div>
        {plan.discount && <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">Economize {plan.discount}%</Badge>}
        <Separator className="my-4" />
        <ul className="space-y-2">{plan.features.map(f => <li key={f} className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />{f}</li>)}</ul>
      </CardContent>
      <CardFooter><Button className="w-full" onClick={() => handleSelectPlan(plan)}>Selecionar Plano</Button></CardFooter>
    </Card>
  );

  const renderSubscriptionDetails = () => {
    if (!subscription) return null;

    if (subscription.status === 'PENDING') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Aguardando Pagamento
            </CardTitle>
            <CardDescription>
              Sua assinatura está aguardando a confirmação do pagamento. Estamos verificando o status automaticamente, mas você pode forçar uma atualização a qualquer momento.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => refetch()} disabled={isSubscriptionLoading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isSubscriptionLoading && 'animate-spin')} />
              Verificar Status Agora
            </Button>
          </CardFooter>
        </Card>
      );
    }

    const planDetails = plans.find(p => p.name.toLowerCase() === subscription.plan_name?.trim().toLowerCase());
    const displayValue = subscription.asaas_data?.value ?? subscription.value ?? planDetails?.price ?? 0;

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detalhes da Assinatura</CardTitle>
            {subscription.status !== 'CANCELED' && (
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isSubscriptionLoading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isSubscriptionLoading && 'animate-spin')} />
                Atualizar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><p className="font-bold">Status</p>{getStatusBadge(subscription.status, 'subscription')}</div>
          <div><p className="font-bold">Plano</p><p>{subscription.plan_name}</p></div>
          <div><p className="font-bold">Valor</p><p className="flex items-center"><DollarSign className="h-4 w-4 mr-1" />{formatCurrency(displayValue)}</p></div>
          <div><p className="font-bold">Ciclo</p><p>{subscription.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}</p></div>
          <div><p className="font-bold">Pagamento</p><p className="flex items-center"><CreditCard className="h-4 w-4 mr-1" />{subscription.billing_type.replace('_', ' ')}</p></div>
          <div><p className="font-bold">Próximo Vencimento</p><p className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{formatDate(subscription.next_due_date)}</p></div>
          {subscription.latest_payment && <><div className="col-span-1"><p className="font-bold">Último Pagamento</p><p>{formatDate(subscription.latest_payment.paymentDate)}</p></div><div className="col-span-1"><p className="font-bold">Status Pagamento</p>{getStatusBadge(subscription.latest_payment.status, 'payment')}</div></>}
        </CardContent>
        <CardFooter className="flex-col items-start space-y-4">
          {subscription.status === 'CANCELED' && (
            <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="flex items-center text-sm text-yellow-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Sua assinatura foi cancelada e permanecerá ativa até {formatDate(subscription.next_due_date)}.
              </p>
            </div>
          )}
          <div className="flex justify-between items-center w-full">
            {subscription.status === 'ACTIVE' && subscription.cycle === 'MONTHLY' && <Button onClick={handleUpgrade} className="bg-green-500 hover:bg-green-600"><ArrowUpCircle className="h-4 w-4 mr-2" />Fazer Upgrade para Anual</Button>}
            {subscription.status !== 'CANCELED' && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Cancelar Assinatura</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Sua assinatura permanecerá ativa até o final do ciclo de faturamento atual.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction onClick={cancelSubscription} disabled={isCanceling}>{isCanceling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelando...</> : 'Confirmar'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
          </div>
        </CardFooter>
      </Card>
    );
  };

  const renderContent = () => {
    if (isSubscriptionLoading) {
      return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-24 w-full" /></div>;
    }

    // Se a assinatura estiver ativa ou pendente, mostrar apenas os detalhes.
    if (subscription && (subscription.status === 'ACTIVE' || subscription.status === 'PENDING')) {
      return renderSubscriptionDetails();
    }

    // Se a assinatura estiver cancelada, mostrar os detalhes e as opções para reativar.
    if (subscription && subscription.status === 'CANCELED') {
      return (
        <div className="space-y-8">
          {renderSubscriptionDetails()}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Assinar Novamente</h2>
            <p className="text-center text-muted-foreground mb-6">Seu plano atual foi cancelado. Escolha um novo plano para reativar seu acesso sem interrupções.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{plans.map(renderPlanCard)}</div>
          </div>
        </div>
      );
    }

    // Se não houver assinatura, mostrar apenas as opções de plano.
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Escolha o Plano Ideal para Você</h2>
        {planStatus && planStatus !== 'ACTIVE' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Seu plano atual está como <strong>{planStatus}</strong>. Escolha um plano para continuar.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{plans.map(renderPlanCard)}</div>
      </div>
    );
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Assinatura</h1>
      {renderContent()}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Finalizar Assinatura</DialogTitle><DialogDescription>Plano: {selectedPlan?.name} - {formatCurrency(selectedPlan?.price ?? 0)}/{selectedPlan?.cycle === 'MONTHLY' ? 'mês' : 'ano'}</DialogDescription></DialogHeader><div className="py-4"><Label>Forma de Pagamento</Label><RadioGroup value={selectedPaymentMethod} onValueChange={(v) => setSelectedPaymentMethod(v as Subscription['billing_type'])} className="mt-2 space-y-2"><div className="flex items-center"><RadioGroupItem value="CREDIT_CARD" id="cc" /><Label htmlFor="cc" className="ml-2">Cartão de Crédito</Label></div><div className="flex items-center"><RadioGroupItem value="BOLETO" id="boleto" /><Label htmlFor="boleto" className="ml-2">Boleto</Label></div><div className="flex items-center"><RadioGroupItem value="PIX" id="pix" /><Label htmlFor="pix" className="ml-2">PIX</Label></div></RadioGroup></div><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={createSubscription} disabled={isCreating}>{isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : 'Confirmar e Pagar'}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
};

export default Assinaturas;
