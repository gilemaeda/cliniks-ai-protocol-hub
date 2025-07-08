import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { useClinic } from '@/hooks/useClinic';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Loader2, ShieldCheck, Info, Lock, Calendar, DollarSign, CreditCard as CreditCardIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Definindo interfaces para os tipos
interface Subscription {
  id: string;
  clinic_id: string;
  status: string;
  plan_name: string;
  plan_value: number;
  plan_cycle: string;
  created_at: string;
  updated_at: string;
  asaas_subscription_id?: string;
  next_due_date?: string;
  payment_url?: string;
  asaas_data?: {
    cycle: string;
    nextDueDate: string;
    value: number;
    description: string;
    billingType: string;
  };
  latest_payment?: {
    id: string;
    status: string;
    dueDate: string;
    value: number;
    billingType: string;
  };
}

interface Plan {
  name: string;
  cycle: string;
  value: number;
  description: string;
  features: string[];
  recommended?: boolean;
  discount?: number;
}

interface TrialData {
  status: string;
  trial_end_date: string;
  days_left: number;
}

interface PlanSelectionProps {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  selectedBillingType: string;
  setSelectedBillingType: (type: string) => void;
  handleCreateSubscription: () => void;
  creatingSubscription: boolean;
  planStatus: string | null;
  trialDaysRemaining: number | null;
}

const planos = [
  { nome: 'Mensal', valor: 29.90, ciclo: 'MONTHLY', descricao: 'Plano completo com todas as funcionalidades', valorTotal: 29.90 },
  { nome: 'Anual', valor: 19.90, ciclo: 'YEARLY', descricao: 'Plano completo com todas as funcionalidades (economia de 33%)', valorTotal: 238.80 }
];

// Funções auxiliares
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
    case 'CONFIRMED':
      return <Badge variant="success">Ativa</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pendente</Badge>;
    case 'OVERDUE':
      return <Badge variant="destructive">Vencida</Badge>;
    case 'INACTIVE':
      return <Badge variant="secondary">Inativa</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getBillingTypeText = (type: string) => {
  const types: { [key: string]: string } = {
    CREDIT_CARD: 'Cartão de Crédito',
    BOLETO: 'Boleto',
    PIX: 'PIX',
  };
  return types[type] || type;
};

const getCycleText = (cycle: string) => {
  const cycles: { [key: string]: string } = {
    WEEKLY: 'Semanal',
    BIWEEKLY: 'Quinzenal',
    MONTHLY: 'Mensal',
    QUARTERLY: 'Trimestral',
    SEMIANNUALLY: 'Semestral',
    YEARLY: 'Anual',
  };
  return cycles[cycle] || cycle;
};

const InfoIcon = ({ className }: { className?: string }) => <Info className={className} />;

// Componente de visualização para profissionais
const ProfessionalSubscriptionView = ({ subscription }: { subscription: Subscription | null }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <ShieldCheck className="h-6 w-6 text-blue-500" />
        <span>Status do Plano da Clínica</span>
      </CardTitle>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Informações sobre a assinatura da clínica à qual você pertence.
      </p>
    </CardHeader>
    <CardContent className="space-y-6">
      {subscription ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Status</span>
            {getStatusBadge(subscription.status)}
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">Plano</span>
            <span className="text-lg font-semibold">{subscription.plan_name}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">Próximo Vencimento</span>
            <span className="text-gray-700 dark:text-gray-300">{formatDate(subscription.next_due_date)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhuma Assinatura Ativa</h3>
          <p className="mt-1 text-sm text-gray-500">
            A clínica não possui uma assinatura ativa no momento.
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">Carregando dados da assinatura...</span>
  </div>
);

const PlanSelection = ({ 
  selectedPlan, 
  setSelectedPlan, 
  selectedBillingType, 
  setSelectedBillingType, 
  handleCreateSubscription, 
  creatingSubscription,
  planStatus,
  trialDaysRemaining
}: PlanSelectionProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Planos de Assinatura</CardTitle>
        <CardDescription>
          Escolha o plano que melhor se adapta às necessidades da sua clínica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {planStatus === 'TRIAL' && trialDaysRemaining && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Período de teste ativo</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Você está no período de teste gratuito. Restam {trialDaysRemaining} dias.
                    Assine agora para continuar utilizando todos os recursos após o término do período de teste.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Progress value={(7 - trialDaysRemaining) / 7 * 100} className="h-2" />
                <p className="text-xs text-blue-600 mt-1 text-right">{trialDaysRemaining}/7 dias restantes</p>
              </div>
            </div>
          )}

          {planStatus === 'INACTIVE' && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Acesso limitado</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Sua clínica está com acesso limitado. Assine um plano para desbloquear todas as funcionalidades.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planos.map((plano) => (
              <div 
                key={plano.nome}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${selectedPlan === plano.nome ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setSelectedPlan(plano.nome)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{plano.nome}</h3>
                    <p className="text-gray-500 text-sm">{plano.descricao}</p>
                  </div>
                  {selectedPlan === plano.nome && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{formatCurrency(plano.valor)}</span>
                    <span className="text-gray-500 ml-1">/mês</span>
                  </div>
                  {plano.nome === 'Anual' && (
                    <p className="text-sm text-green-600 mt-1">Economia de 33% em relação ao plano mensal</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {plano.nome === 'Mensal' ? 'Cobrança mensal de ' : 'Valor anual de '}
                    <span className="font-medium">{formatCurrency(plano.valorTotal)}</span>
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Recursos inclusos:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Protocolos ilimitados
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Avaliações com IA
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Gerenciamento de profissionais
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Suporte prioritário
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="text-base font-medium mb-3">Forma de pagamento</h4>
            <Select
              value={selectedBillingType}
              onValueChange={setSelectedBillingType}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">Pagamento processado com segurança via Asaas</p>
                O pagamento será processado automaticamente de acordo com o ciclo selecionado.
                Você pode cancelar sua assinatura a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SubscriptionDetails = ({ subscription }: { subscription: Subscription }) => {
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Isso limitará o acesso às funcionalidades da plataforma.')) {
      return;
    }

    setCancelingSubscription(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão não encontrada. Faça login novamente.');

      const response = await supabase.functions.invoke('cancel-subscription', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription_id: subscription.asaas_subscription_id
        })
      });

      if (response.error) throw new Error(response.error.message);

      toast({ title: 'Assinatura cancelada com sucesso', description: 'Sua assinatura será válida até o final do período atual.', variant: 'success' });
      setTimeout(() => navigate(0), 1500); // Recarrega a página após 1.5 segundos
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
    } finally {
      setCancelingSubscription(false);
    }
  };

  // Determinar se o último pagamento está pendente ou atrasado
  const hasPaymentIssue = subscription.latest_payment && 
    ['PENDING', 'OVERDUE'].includes(subscription.latest_payment.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            <span>Detalhes da Assinatura</span>
          </CardTitle>
          {getStatusBadge(subscription.status)}
        </div>
        <CardDescription>
          Informações sobre sua assinatura atual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {hasPaymentIssue && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Atenção: Pagamento pendente</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Seu último pagamento está {subscription.latest_payment?.status === 'PENDING' ? 'pendente' : 'atrasado'}. 
                    Por favor, verifique seu método de pagamento para evitar a suspensão do serviço.
                  </p>
                  {subscription.payment_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 bg-white" 
                      onClick={() => window.open(subscription.payment_url, '_blank')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Acessar página de pagamento
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium mb-2">Informações do Plano</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Plano:</span>
                    <span className="font-medium">{subscription.plan_name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="font-medium">{formatCurrency(subscription.plan_value)}/mês</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ciclo:</span>
                    <span className="font-medium">{getCycleText(subscription.plan_cycle)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Forma de pagamento:</span>
                    <span className="font-medium">{getBillingTypeText(subscription.billing_type || subscription.asaas_data?.billingType || '')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium mb-2">Status e Datas</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Próximo vencimento:</span>
                    <span className="font-medium">{formatDate(subscription.next_due_date || subscription.asaas_data?.nextDueDate || '')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assinatura criada em:</span>
                    <span className="font-medium">{formatDate(subscription.created_at)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Última atualização:</span>
                    <span className="font-medium">{formatDate(subscription.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {subscription.latest_payment && (
            <div>
              <h3 className="text-base font-medium mb-2">Último Pagamento</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div>{getStatusBadge(subscription.latest_payment.status)}</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="font-medium">{formatCurrency(subscription.latest_payment.value)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vencimento:</span>
                  <span className="font-medium">{formatDate(subscription.latest_payment.dueDate)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Forma de pagamento:</span>
                  <span className="font-medium">{getBillingTypeText(subscription.latest_payment.billingType)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/dashboard'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Dashboard
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={handleCancelSubscription}
          disabled={cancelingSubscription}
        >
          {cancelingSubscription ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Cancelar Assinatura
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}; 

const ErrorState = ({ error, onRetry }: { error: string | null, onRetry: () => void }) => (
  <Card className="border-destructive">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <span>Ocorreu um Erro</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <p className="text-gray-600 dark:text-gray-400">{error}</p>
      <Button onClick={onRetry}>Tentar Novamente</Button>
    </CardContent>
  </Card>
);

const Assinaturas = () => {
  const { profile } = useAuth();
  const { clinic, planStatus, trialDaysRemaining } = useClinic();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Anual');
  const [selectedBillingType, setSelectedBillingType] = useState('CREDIT_CARD');
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [activeTab, setActiveTab] = useState('planos');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    if (!clinic?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão não encontrada. Faça login novamente.');

      console.log('Chamando Edge Function com clinic_id:', clinic.id);
      const response = await supabase.functions.invoke('get-subscription-data', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clinic_id: clinic.id })
      });
      
      console.log('Resposta da Edge Function:', response);

      if (response.error) throw new Error(response.error.message);
      
      if (response.data?.data) {
        setSubscription(response.data.data);
      } else {
        setSubscription(null);
      }

    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      toast({ title: "Erro ao carregar assinatura", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, toast]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleCreateSubscription = useCallback(async () => {
    if (!clinic?.id) {
      toast({ title: 'Erro', description: 'ID da clínica não encontrado', variant: 'destructive' });
      return;
    }
    setCreatingSubscription(true);
    try {
      const planoSelecionado = planos.find(p => p.nome === selectedPlan);
      if (!planoSelecionado) throw new Error('Plano não encontrado');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão não encontrada. Faça login novamente.');

      console.log('Criando assinatura com dados:', {
        clinic_id: clinic.id,
        plan_name: planoSelecionado.nome,
        value: planoSelecionado.valor,
        cycle: planoSelecionado.ciclo,
        billing_type: selectedBillingType
      });
      
      const response = await supabase.functions.invoke('create-subscription', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clinic_id: clinic.id,
          plan_name: planoSelecionado.nome,
          value: planoSelecionado.valor,
          cycle: planoSelecionado.ciclo,
          billing_type: selectedBillingType,
          description: `Plano ${planoSelecionado.nome} - Cliniks AI Protocol Hub`
        })
      });
      
      console.log('Resposta da criação de assinatura:', response);

      if (response.error) throw new Error(response.error.message);
      
      const result = response.data;
      
      if (result.data?.payment_url) {
        setPaymentUrl(result.data.payment_url);
        setActiveTab('pagamento');
        toast({ title: 'Link de pagamento gerado', description: 'Prossiga para finalizar sua assinatura', variant: 'success' });
      } else {
        toast({ title: 'Assinatura criada com sucesso!', description: 'Aguarde a confirmação do pagamento.', variant: 'success' });
        fetchSubscriptionData();
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
    } finally {
      setCreatingSubscription(false);
    }
  }, [clinic?.id, selectedPlan, selectedBillingType, toast, fetchSubscriptionData]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!clinic?.id) {
      toast({ title: 'Erro', description: 'ID da clínica não encontrado', variant: 'destructive' });
      return;
    }
    setCheckingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão não encontrada. Faça login novamente.');
      
      const response = await supabase.functions.invoke('check-subscription-status', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clinic_id: clinic.id
        })
      });

      if (response.error) throw new Error(response.error.message);
      
      const result = response.data;
      
      if (result.status === 'ACTIVE' || result.status === 'CONFIRMED') {
        toast({ title: 'Assinatura ativa!', description: 'Seu pagamento foi confirmado com sucesso.', variant: 'success' });
        fetchSubscriptionData();
        setActiveTab('detalhes');
      } else if (result.status === 'PENDING') {
        toast({ title: 'Pagamento pendente', description: 'Seu pagamento ainda está sendo processado. Tente novamente em alguns minutos.', variant: 'warning' });
      } else {
        toast({ title: 'Pagamento não confirmado', description: `Status atual: ${result.status}. Verifique seu método de pagamento.`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
    } finally {
      setCheckingStatus(false);
    }
  }, [clinic?.id, toast, fetchSubscriptionData]);

  // Componente para exibir o link de pagamento e permitir verificação do status
  const PaymentView = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Finalizar Pagamento</CardTitle>
        <CardDescription>
          Seu link de pagamento foi gerado. Complete o pagamento para ativar sua assinatura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Instruções</h4>
              <p className="text-sm text-blue-700 mt-1">
                1. Clique no botão abaixo para acessar a página de pagamento segura.<br />
                2. Complete o pagamento usando o método selecionado.<br />
                3. Após a confirmação, retorne a esta página e clique em "Verificar Status".
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Button 
            className="w-full md:w-auto" 
            size="lg"
            onClick={() => window.open(paymentUrl, '_blank')}
          >
            <CreditCardIcon className="mr-2 h-5 w-5" />
            Ir para Página de Pagamento
          </Button>
          
          <div className="w-full border-t border-gray-200 my-4" />
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Já realizou o pagamento?</p>
            <Button 
              variant="outline" 
              onClick={checkSubscriptionStatus}
              disabled={checkingStatus}
              className="w-full md:w-auto"
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verificar Status do Pagamento
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveTab('planos')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Planos
        </Button>
      </CardFooter>
    </Card>
  );

  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={fetchSubscriptionData} />;
    if (profile?.role === 'professional') return <ProfessionalSubscriptionView subscription={subscription} />;
    
    if (profile?.role === 'clinic_owner') {
      if (activeTab === 'pagamento' && paymentUrl) {
        return <PaymentView />;
      }
      
      if (subscription) {
        return <SubscriptionDetails subscription={subscription} />;
      }
      
      if (planStatus === 'TRIAL' || planStatus === 'INACTIVE') {
        return <PlanSelection 
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          selectedBillingType={selectedBillingType}
          setSelectedBillingType={setSelectedBillingType}
          handleCreateSubscription={handleCreateSubscription}
          creatingSubscription={creatingSubscription}
          planStatus={planStatus}
          trialDaysRemaining={trialDaysRemaining}
        />
      }
    }
    
    return <ErrorState error="Não foi possível determinar o estado da sua conta. Entre em contato com o suporte." onRetry={fetchSubscriptionData} />;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
      {renderContent()}
    </div>
  );
};

export default Assinaturas;
