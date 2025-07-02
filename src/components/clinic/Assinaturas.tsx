import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import { ArrowLeft, CreditCard, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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

const Assinaturas = () => {
  console.log('Assinaturas: Componente sendo renderizado');
  const { user } = useAuth();
  const { clinic } = useClinic();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  console.log('Assinaturas: Estado inicial -', { user, clinic, clinic_id: clinic?.clinic_id || clinic?.id });
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Essencial');
  const [selectedBillingType, setSelectedBillingType] = useState('CREDIT_CARD');

  const fetchSubscriptionData = useCallback(async () => {
    if (!clinic?.clinic_id) {
      console.log('fetchSubscriptionData: Nenhum clinic_id disponível');
      setLoading(false);
      return;
    }
    
    console.log('fetchSubscriptionData: Iniciando busca para clinic_id:', clinic.clinic_id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('clinic_id', clinic.clinic_id)
        .maybeSingle();

      console.log('fetchSubscriptionData: Resposta do Supabase:', { data, error });

      if (error) throw error;
      
      // Mesmo que não tenha erro, verificamos se temos dados
      if (data === null) {
        console.log('fetchSubscriptionData: Nenhuma assinatura encontrada');
      } else {
        console.log('fetchSubscriptionData: Assinatura encontrada:', data);
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao buscar dados da assinatura:', error);
      toast({
        title: "Erro ao carregar assinatura",
        description: "Não foi possível carregar os dados da sua assinatura",
        variant: "destructive"
      });
    } finally {
      console.log('fetchSubscriptionData: Finalizando loading');
      setLoading(false);
    }
  }, [clinic?.clinic_id, toast]);

  useEffect(() => {
    console.log('Assinaturas: useEffect para fetchSubscriptionData', { clinic });
    if (clinic?.clinic_id) {
      console.log('Assinaturas: Chamando fetchSubscriptionData com clinic_id:', clinic.clinic_id);
      fetchSubscriptionData();
    } else {
      console.log('Assinaturas: clinic_id não disponível, não é possível buscar dados');
      setLoading(false); // Evita loading infinito se não houver clinic_id
    }
  }, [clinic, fetchSubscriptionData]);

  const handleCreateSubscription = async () => {
    console.log('Assinaturas: handleCreateSubscription iniciado');
    
    // Usar clinic.id em vez de clinic.clinic_id, já que o objeto clinic vem diretamente da tabela clinics
    const clinicId = clinic?.id;
    console.log('Assinaturas: Verificando ID da clínica:', { clinic, clinicId });
    
    if (!clinicId) {
      console.error('Assinaturas: ID da clínica não disponível');
      toast({
        title: "Erro ao criar assinatura",
        description: "Não foi possível identificar a clínica. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }
    
    setCreatingSubscription(true);
    try {
      console.log('Assinaturas: Plano selecionado:', selectedPlan);
      const planoSelecionado = planos.find(p => p.nome === selectedPlan);
      
      if (!planoSelecionado) {
        console.error('Assinaturas: Plano não encontrado');
        throw new Error('Plano não encontrado');
      }
      
      console.log('Assinaturas: Enviando requisição para Edge Function com dados:', {
        clinicId: clinicId,
        planName: planoSelecionado.nome,
        billingType: selectedBillingType,
        value: planoSelecionado.valor,
        cycle: planoSelecionado.ciclo
      });
      
      const { data, error } = await supabase.functions.invoke('create-asaas-subscription', {
        body: {
          clinicId: clinicId,
          planName: planoSelecionado.nome,
          billingType: selectedBillingType,
          value: planoSelecionado.valor,
          cycle: planoSelecionado.ciclo
        }
      });

      console.log('Assinaturas: Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('Assinaturas: Erro retornado pela Edge Function:', error);
        // Tentar extrair mais detalhes do erro
        if (error.message && error.message.includes('500')) {
          console.error('Assinaturas: Erro 500 detectado, pode ser problema com variáveis de ambiente ou configuração da Edge Function');
          // Tentar extrair o corpo da resposta de erro se disponível
          try {
            // @ts-expect-error - Acessando propriedades não documentadas do objeto de erro
            if (error.context && error.context.response) {
              const responseText = await error.context.response.text();
              console.error('Assinaturas: Detalhes do erro 500:', responseText);
            }
          } catch (extractError) {
            console.error('Assinaturas: Não foi possível extrair detalhes adicionais do erro:', extractError);
          }
        }
        throw error;
      }
      
      toast({
        title: "Assinatura criada!",
        description: "Sua assinatura foi criada com sucesso",
        variant: "default"
      });
      
      setSubscription(data);
    } catch (error) {
      console.error('Assinaturas: Erro ao criar assinatura:', error);
      console.log('Assinaturas: Tipo do erro:', typeof error);
      console.log('Assinaturas: Mensagem do erro:', error.message);
      console.log('Assinaturas: Stack trace:', error.stack);
      
      // Mensagem personalizada baseada no tipo de erro
      let errorMessage = "Ocorreu um erro ao tentar criar a assinatura. Por favor, tente novamente mais tarde.";
      
      if (error.message && error.message.includes('500')) {
        errorMessage = "Erro no servidor: A configuração da integração com o serviço de pagamento está incompleta. Por favor, entre em contato com o suporte técnico.";
      } else if (error.message && error.message.includes('409')) {
        errorMessage = "Esta clínica já possui uma assinatura ativa.";
      }
      
      toast({
        title: "Erro ao criar assinatura",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('Assinaturas: Finalizando criação de assinatura');
      setCreatingSubscription(false);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Atrasada</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-500">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
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
      case 'WEEKLY':
        return 'Semanal';
      case 'BIWEEKLY':
        return 'Quinzenal';
      case 'QUARTERLY':
        return 'Trimestral';
      case 'SEMIANNUALLY':
        return 'Semestral';
      default:
        return cycle;
    }
  };

  // Adicionando log antes do return para debug
  console.log('Assinaturas: Antes do return -', { loading, subscription, clinic });
  
  // Forçar timeout para garantir que não fique em loading infinito
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log('Assinaturas: Timeout de segurança ativado');
        setLoading(false);
      }, 5000); // 5 segundos de timeout
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Gerenciamento de Assinatura</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Carregando dados da assinatura...</span>
        </div>
      ) : subscription ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Assinatura {subscription.plan_name}</CardTitle>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Detalhes da Assinatura</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Forma de pagamento: {getBillingTypeText(subscription.billing_type)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Próximo vencimento: {formatDate(subscription.next_due_date)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Ciclo: {getCycleText(subscription.cycle)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Informações de Pagamento</h3>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(subscription.value)}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      /{subscription.cycle.toLowerCase() === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    {subscription.asaas_payment_link && (
                      <Button 
                        onClick={() => window.open(subscription.asaas_payment_link, '_blank')}
                        className="w-full"
                      >
                        Acessar Portal de Pagamento
                      </Button>
                    )}
                  </div>
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
                <Button 
                  onClick={handleCreateSubscription} 
                  disabled={creatingSubscription}
                  className="w-full"
                >
                  {creatingSubscription ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Criar Assinatura'
                  )}
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
