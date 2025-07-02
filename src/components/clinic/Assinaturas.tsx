import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/hooks/useClinic';
import { ArrowLeft, CreditCard, Calendar, Clock, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Definindo interfaces para os tipos
interface Subscription {
  id: string;
  clinic_id: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  asaas_payment_link: string | null;
  plan_name: string;
  status: string;
  billing_type: string;
  value: number;
  next_due_date: string;
  cycle: string;
  created_at: string;
  updated_at: string;
}

const planos = [
  { nome: 'Essencial', valor: 19.90, ciclo: 'MONTHLY', descricao: 'Plano completo com todas as funcionalidades' }
];

// Funções auxiliares (movidas para fora para serem reutilizáveis)
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
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
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
    case 'WEEKLY':
      return 'Semanal';
    case 'BIWEEKLY':
      return 'Quinzenal';
    case 'MONTHLY':
      return 'Mensal';
    case 'QUARTERLY':
      return 'Trimestral';
    case 'SEMIANNUALLY':
      return 'Semestral';
    case 'YEARLY':
      return 'Anual';
    default:
      return cycle;
  }
};

const Assinaturas = () => {
  const { user, profile } = useAuth(); // Adicionado profile
  const { clinic } = useClinic();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Essencial');
  const [selectedBillingType, setSelectedBillingType] = useState('CREDIT_CARD');

  const fetchSubscriptionData = useCallback(async () => {
    if (!clinic?.clinic_id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('clinic_id', clinic.clinic_id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao buscar dados da assinatura:', error);
      toast({
        title: "Erro ao carregar assinatura",
        description: "Não foi possível carregar os dados da sua assinatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [clinic?.clinic_id, toast]);

  useEffect(() => {
    if (clinic?.clinic_id) {
      fetchSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [clinic, fetchSubscriptionData]);

  const handleCreateSubscription = async () => {
    const clinicId = clinic?.id;
    if (!clinicId) {
      toast({ title: 'Erro', description: 'ID da clínica não encontrado.', variant: 'destructive' });
      return;
    }

    setCreatingSubscription(true);
    const plano = planos.find(p => p.nome === selectedPlan);
    if (!plano) {
      toast({ title: 'Erro', description: 'Plano selecionado não é válido.', variant: 'destructive' });
      setCreatingSubscription(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-asaas-subscription', {
        body: {
          clinic_id: clinicId,
          plan_name: plano.nome,
          billing_type: selectedBillingType,
          value: plano.valor,
          cycle: plano.ciclo,
        },
      });

      if (error) {
        if (error.context?.status === 500) {
          const responseText = await error.context.json();
          toast({ title: 'Erro de Configuração', description: responseText.error || 'Ocorreu um erro interno no servidor.', variant: 'destructive', duration: 9000 });
        } else {
          toast({ title: 'Erro ao Criar Assinatura', description: error.message, variant: 'destructive' });
        }
        return;
      }

      toast({ title: 'Sucesso!', description: 'Assinatura criada. Redirecionando para pagamento...' });
      if (data.paymentLink) {
        window.open(data.paymentLink, '_blank');
      }
      await fetchSubscriptionData();

    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setCreatingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  // Renderização condicional baseada na role
  if (profile?.role === 'professional') {
    return <ProfessionalSubscriptionView subscription={subscription} />;
  }

  // View padrão para clinic_owner
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Plano Atual</h3>
                <p className="text-2xl font-bold">{subscription.plan_name}</p>
                <p>{getStatusBadge(subscription.status)}</p>
              </div>
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium">Pagamento</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Valor</span>
                  <span className="font-semibold">{formatCurrency(subscription.value)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ciclo</span>
                  <span className="font-semibold">{getCycleText(subscription.cycle)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Próximo Vencimento</span>
                  <span className="font-semibold">{formatDate(subscription.next_due_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Forma de Pagamento</span>
                  <span className="font-semibold">{getBillingTypeText(subscription.billing_type)}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-4">Histórico</h3>
              <div className="text-sm text-gray-500">
                <p>Assinatura criada em: {formatDate(subscription.created_at)}</p>
                <p>Última atualização: {formatDate(subscription.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plano</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.nome} value={plano.nome}>
                        {plano.nome} - {formatCurrency(plano.valor)}/{plano.ciclo.toLowerCase() === 'monthly' ? 'mês' : 'ano'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                <Select value={selectedBillingType} onValueChange={setSelectedBillingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4">
                <Button onClick={handleCreateSubscription} disabled={creatingSubscription} className="w-full">
                  {creatingSubscription ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>) : ('Criar Assinatura')}
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">Informações sobre assinaturas</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Ao criar uma assinatura, você terá acesso a todos os recursos do plano escolhido.
                    O pagamento será processado automaticamente de acordo com o ciclo selecionado.
                    Você pode cancelar sua assinatura a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// View para profissionais
const ProfessionalSubscriptionView = ({ subscription }: { subscription: Subscription | null }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
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
                <span className="text-gray-700 dark:text-gray-300">{subscription.plan_name}</span>
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
    </div>
  );
};

// Componente de ícone de informação
const InfoIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default Assinaturas;
