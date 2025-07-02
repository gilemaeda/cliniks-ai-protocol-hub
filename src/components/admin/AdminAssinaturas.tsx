import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

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

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciamento de Assinaturas</CardTitle>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssinaturas;
