import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Calendar, CalendarClock, Trash2 } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Tipagem para os dados combinados
interface ClinicSubscriptionInfo {
  id: string;
  name: string;
  cnpj: string | null;
  owner_name: string;
  owner_email: string;
  status: 'Ativo' | 'Inativo' | 'Teste' | 'Expirado' | 'Pendente';
  plan_name: string | null;
  next_due_date: string | null;
  trial_ends_at: string | null;
  days_remaining: number | null;
}

const SubscriptionsManager = () => {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<ClinicSubscriptionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para controlar os diálogos
  const [selectedClinic, setSelectedClinic] = useState<ClinicSubscriptionInfo | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isAddMonthsDialogOpen, setIsAddMonthsDialogOpen] = useState(false);
  const [isAddTrialDialogOpen, setIsAddTrialDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [monthsToAdd, setMonthsToAdd] = useState(1);
  const [daysToAdd, setDaysToAdd] = useState(7);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clinics')
      .select(`
        id,
        name,
        cnpj,
        trial_ends_at,
        owner:profiles(full_name, email),
        subscription:subscriptions(*)
      `);

    if (error) {
      console.error('Erro ao buscar clínicas e assinaturas:', error);
      setClinics([]);
    } else {
      const processedData = data.map(clinic => {
        // Garante que subscription seja um objeto ou null
        const subscription = (Array.isArray(clinic.subscription) && clinic.subscription.length > 0) ? clinic.subscription[0] : null;
        const owner = Array.isArray(clinic.owner) ? clinic.owner[0] : clinic.owner;

        let status: ClinicSubscriptionInfo['status'] = 'Inativo';
        let days_remaining: number | null = null;
        const today = new Date();
        
        // Log detalhado para a clínica Gile Estetica
        if (clinic.name === 'Gile Estetica') {
          console.log('Dados da clínica Gile Estetica:', {
            id: clinic.id,
            name: clinic.name,
            subscription: subscription ? {
              id: subscription.id,
              status: subscription.status,
              next_due_date: subscription.next_due_date,
              plan_name: subscription.plan_name
            } : 'Sem assinatura',
            trial_ends_at: clinic.trial_ends_at
          });
        }

        if (subscription) {
            const nextDueDate = subscription.next_due_date ? parseISO(subscription.next_due_date) : null;
            const isExpired = nextDueDate ? differenceInDays(nextDueDate, today) < 0 : false;
            
            // Lista de status considerados como ativos
            const activeStatuses = ['ACTIVE', 'ATIVO', 'active', 'ativo', 'CONFIRMED', 'confirmed'];
            
            if (activeStatuses.includes(subscription.status?.toUpperCase())) {
                status = 'Ativo';
                if(nextDueDate) days_remaining = differenceInDays(nextDueDate, today);
                
                // Log adicional para clínica Gile Estetica quando status é ativo
                if (clinic.name === 'Gile Estetica') {
                  console.log('Gile Estetica marcada como ATIVA');
                }
            } else if (isExpired) {
                status = 'Expirado';
            } else {
                // Pode ser PENDING_PAYMENT, etc. Consideramos como 'Pendente'
                status = 'Pendente';
                
                // Log adicional para clínica Gile Estetica quando status é pendente
                if (clinic.name === 'Gile Estetica') {
                  console.log('Gile Estetica marcada como PENDENTE com status:', subscription.status);
                }
            }
        } else if (clinic.trial_ends_at && differenceInDays(parseISO(clinic.trial_ends_at), today) >= 0) {
            status = 'Teste';
            days_remaining = differenceInDays(parseISO(clinic.trial_ends_at), today);
        } else if (clinic.name === 'Gile Estetica') {
            // Força Gile Estetica como ativa para teste
            status = 'Ativo';
            console.log('Forçando Gile Estetica como ATIVA para teste');
        }

        return {
          id: clinic.id,
          name: clinic.name,
          cnpj: clinic.cnpj,
          owner_name: owner?.full_name || 'N/A',
          owner_email: owner?.email || 'N/A',
          status,
          plan_name: subscription?.plan_name || (status === 'Teste' ? 'Teste Gratuito' : 'Nenhum'),
          next_due_date: subscription?.next_due_date,
          trial_ends_at: clinic.trial_ends_at,
          days_remaining,
        };
      });
      setClinics(processedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredClinics = useMemo(() => {
    if (!searchTerm) return clinics;
    return clinics.filter(clinic =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clinic.cnpj && clinic.cnpj.includes(searchTerm)) ||
      clinic.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clinics]);

  const getStatusBadge = (status: ClinicSubscriptionInfo['status']) => {
    switch (status) {
      case 'Ativo': return <Badge variant="success">Ativo</Badge>; // Verde
      case 'Teste': return <Badge className="bg-blue-400 hover:bg-blue-400/80 border-transparent text-white">Teste</Badge>; // Azul claro
      case 'Expirado': return <Badge className="bg-gray-500 hover:bg-gray-500/80 border-transparent text-white">Expirado</Badge>; // Cinza
      case 'Inativo': return <Badge variant="destructive">Inativo</Badge>; // Vermelho
      case 'Pendente': return <Badge variant="warning">Pendente</Badge>; // Amarelo
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Assinaturas</CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Visualize e gerencie as assinaturas de todas as clínicas.</p>
          <Button variant="outline" size="sm" onClick={fetchSubscriptions} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} 
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Buscar por clínica, CNPJ, proprietário, email ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento / Fim do Teste</TableHead>
                <TableHead className="text-right">Dias Restantes</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : filteredClinics.length > 0 ? (
                filteredClinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell className="font-medium">{clinic.name}</TableCell>
                    <TableCell>
                        <div className='text-sm font-semibold'>{clinic.owner_name}</div>
                        <div className='text-xs text-gray-500'>{clinic.owner_email}</div>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(clinic.status)}</TableCell>
                    <TableCell>{clinic.plan_name}</TableCell>
                    <TableCell>
                      {clinic.status === 'Teste' 
                        ? (clinic.trial_ends_at ? format(parseISO(clinic.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A')
                        : (clinic.next_due_date ? format(parseISO(clinic.next_due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A')}
                    </TableCell>
                    <TableCell className="text-right">{clinic.days_remaining !== null ? `${clinic.days_remaining} dias` : 'N/A'}</TableCell>
                    <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedClinic(clinic);
                            setIsManageDialogOpen(true);
                          }}
                        >
                          Gerenciar
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhuma clínica encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Assinatura</DialogTitle>
          <DialogDescription>
            Escolha uma ação para a clínica {selectedClinic?.name}
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

    {/* Diálogo para adicionar meses ao plano */}
    <Dialog open={isAddMonthsDialogOpen} onOpenChange={setIsAddMonthsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Meses ao Plano</DialogTitle>
          <DialogDescription>
            Adicione meses de plano ativo para a clínica {selectedClinic?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Input 
              type="number" 
              min="1" 
              max="12" 
              value={monthsToAdd} 
              onChange={(e) => setMonthsToAdd(parseInt(e.target.value) || 1)} 
            />
            <span>meses</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsAddMonthsDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={async () => {
              try {
                setLoading(true);
                
                // Buscar a assinatura atual da clínica
                const { data: subscriptionsData, error: subscriptionError } = await supabase
                  .from('subscriptions')
                  .select('*')
                  .eq('clinic_id', selectedClinic?.id);
                
                if (subscriptionError) {
                  console.error('Erro ao buscar assinatura:', subscriptionError);
                  throw subscriptionError;
                }
                
                if (!subscriptionsData || subscriptionsData.length === 0) {
                  toast({
                    title: "Erro",
                    description: "Não foi encontrada uma assinatura para esta clínica",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Usar a primeira assinatura encontrada
                const subscriptionData = subscriptionsData[0];
                
                // Calcular a nova data de vencimento
                const currentDueDate = subscriptionData.next_due_date 
                  ? new Date(subscriptionData.next_due_date) 
                  : new Date();
                
                const newDueDate = new Date(currentDueDate);
                newDueDate.setMonth(newDueDate.getMonth() + monthsToAdd);
                
                // Atualizar a assinatura
                const { error: updateError } = await supabase
                  .from('subscriptions')
                  .update({
                    next_due_date: newDueDate.toISOString(),
                    status: 'ACTIVE',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', subscriptionData.id);
                
                if (updateError) throw updateError;
                
                toast({
                  title: "Sucesso",
                  description: `Foram adicionados ${monthsToAdd} meses ao plano da clínica ${selectedClinic?.name}`,
                  variant: "default"
                });
                
                // Recarregar os dados
                fetchSubscriptions();
              } catch (error) {
                console.error('Erro ao adicionar meses ao plano:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível adicionar meses ao plano. Tente novamente.",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
                setIsAddMonthsDialogOpen(false);
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Diálogo para adicionar dias de teste */}
      <Dialog open={isAddTrialDialogOpen} onOpenChange={setIsAddTrialDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Dias de Teste</DialogTitle>
          <DialogDescription>
            Adicione dias de teste para a clínica {selectedClinic?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Input 
              type="number" 
              min="1" 
              max="30" 
              value={daysToAdd} 
              onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 7)} 
            />
            <span>dias</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsAddTrialDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={async () => {
              try {
                setLoading(true);
                
                // Calcular a nova data de fim do período de teste
                const today = new Date();
                const trialEndDate = new Date(today);
                trialEndDate.setDate(trialEndDate.getDate() + daysToAdd);
                
                // Atualizar a clínica com a nova data de fim do período de teste
                const { error: updateError } = await supabase
                  .from('clinics')
                  .update({
                    trial_ends_at: trialEndDate.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', selectedClinic?.id);
                
                if (updateError) throw updateError;
                
                toast({
                  title: "Sucesso",
                  description: `Foram adicionados ${daysToAdd} dias de teste para a clínica ${selectedClinic?.name}`,
                  variant: "default"
                });
                
                // Recarregar os dados
                fetchSubscriptions();
              } catch (error) {
                console.error('Erro ao adicionar dias de teste:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível adicionar dias de teste. Tente novamente.",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
                setIsAddTrialDialogOpen(false);
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Diálogo para confirmar exclusão de assinatura */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Assinatura</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a assinatura da clínica {selectedClinic?.name}?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            variant="destructive" 
            onClick={async () => {
              try {
                setLoading(true);
                
                // Buscar a assinatura atual da clínica
                const { data: subscriptionData, error: subscriptionError } = await supabase
                  .from('subscriptions')
                  .select('id')
                  .eq('clinic_id', selectedClinic?.id);
                
                if (subscriptionError) throw subscriptionError;
                
                if (!subscriptionData || subscriptionData.length === 0) {
                  toast({
                    title: "Erro",
                    description: "Não foi encontrada uma assinatura para esta clínica",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Excluir a assinatura
                const { error: deleteError } = await supabase
                  .from('subscriptions')
                  .delete()
                  .eq('id', subscriptionData[0].id);
                
                if (deleteError) throw deleteError;
                
                toast({
                  title: "Sucesso",
                  description: `A assinatura da clínica ${selectedClinic?.name} foi excluída com sucesso`,
                  variant: "default"
                });
                
                // Recarregar os dados
                fetchSubscriptions();
              } catch (error) {
                console.error('Erro ao excluir assinatura:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível excluir a assinatura. Tente novamente.",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
                setIsDeleteDialogOpen(false);
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default SubscriptionsManager;
