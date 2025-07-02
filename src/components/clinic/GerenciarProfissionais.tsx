import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/hooks/useClinic';
import { Plus, UserCheck, UserX, Edit, Trash2 } from 'lucide-react';

type Professional = {
  id: string;
  user_id: string;
  clinic_id: string;
  specialty: string | null;
  council_number: string | null;
  is_active: boolean;
  created_at: string;
  full_name: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  formation: string | null;
};

const GerenciarProfissionais = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { clinic, loading: clinicLoading, refetchClinic } = useClinic();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    cpf: '',
    phone: '',
    formation: '',
    specialty: '',
    council_number: '',
  });
  const [newProfessional, setNewProfessional] = useState({
    email: '',
    full_name: '',
    cpf: '',
    formation: '',
    phone: '',
    password: '',
    specialty: '',
    council_number: ''
  });

  const fetchProfessionals = useCallback(async () => {
    if (authLoading || clinicLoading || !user || !clinic) {
      console.log('DEBUG: Aguardando autenticação e dados da clínica...');
      return;
    }

    try {
      setLoading(true);
      
      // Usando uma consulta SQL direta em vez da função RPC que está com problemas
      console.log('DEBUG: Executando consulta SQL direta para listar profissionais da clínica:', clinic.id);

      // Verificar se existem profissionais na tabela, sem filtros
      const { data: allProfs, error: allProfsError } = await supabase
        .from('professionals')
        .select('*');
      
      console.log('DEBUG: Todos os profissionais na tabela (sem filtros):', allProfs, allProfsError);

      // Verificar se existem profissionais vinculados a esta clínica
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('clinic_id', clinic.id);

      console.log('DEBUG: Profissionais filtrados por clinic_id:', data, error);
      console.log('DEBUG: UUID da clínica usado no filtro:', clinic.clinic_id);
      console.log('DEBUG: Tipo do clinic_id:', typeof clinic.clinic_id);
        
      // Transformar o resultado para corresponder à estrutura esperada
      let processedData: Professional[] = [];
      if (data) {
        // Buscar perfis dos usuários para obter informações adicionais
        const userIds = data.map(prof => prof.user_id);
        console.log('DEBUG: IDs de usuários para buscar informações:', userIds);
        
        if (userIds.length > 0) {
          // Buscar perfis dos usuários
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', userIds);
            
          console.log('DEBUG: Perfis de usuários encontrados:', profilesData);
          
          // Mapear dados para profissionais
          processedData = data.map(prof => {
            const profile = profilesData?.find(p => p.user_id === prof.user_id);
            return {
              id: prof.id,
              user_id: prof.user_id,
              clinic_id: prof.clinic_id,
              full_name: prof.name || profile?.full_name || 'Sem nome',
              specialty: prof.specialty || '',
              council_number: prof.council_number || '',
              is_active: prof.is_active,
              created_at: prof.created_at,
              email: profile?.email || '',
              cpf: prof.cpf || '',
              phone: prof.phone || '',
              formation: prof.formation || '',
              education: prof.education || ''
            };
          });
        } else {
          // Se não há usuários, criar array vazio de profissionais
          processedData = [];
        }
      }

      console.log('DEBUG: Dados processados dos profissionais:', { processedData, error });

      if (error) {
        console.error('Erro ao buscar profissionais:', error);
        toast({
          title: 'Erro ao carregar profissionais',
          description: 'Por favor, tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      // Verificar se o proprietário da clínica está na tabela professionals
      console.log('DEBUG: Verificando se o proprietário da clínica está na tabela professionals');
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('clinic_id', clinic.clinic_id)
        .eq('role', 'clinic_owner')
        .single();

      console.log('DEBUG: Perfil do proprietário da clínica:', ownerProfile);

      if (ownerProfile) {
        // Verificar se o proprietário já está na tabela professionals
        const { data: ownerProfessional } = await supabase
          .from('professionals')
          .select('*')
          .eq('user_id', ownerProfile.user_id)
          .single();

        console.log('DEBUG: Profissional do proprietário:', ownerProfessional);

        // Se o proprietário não estiver na tabela professionals, adicionar
        if (!ownerProfessional) {
          console.log('DEBUG: Proprietário não encontrado na tabela professionals, adicionando...');
          
          // Adicionar o proprietário como profissional
          const { data: newProfessional, error: insertError } = await supabase
            .from('professionals')
            .insert([
              {
                user_id: ownerProfile.user_id,
                clinic_id: clinic.clinic_id,
                name: ownerProfile.full_name,
                is_active: true
              }
            ])
            .select()
            .single();

          console.log('DEBUG: Resultado da inserção do proprietário como profissional:', { newProfessional, insertError });
          
          // Se a inserção foi bem-sucedida, adicionar à lista de profissionais
          if (newProfessional && !insertError) {
            const ownerAsProfessional: Professional = {
              id: newProfessional.id,
              user_id: newProfessional.user_id,
              clinic_id: newProfessional.clinic_id,
              full_name: newProfessional.name || ownerProfile.full_name,
              specialty: newProfessional.specialty || '',
              council_number: newProfessional.council_number || '',
              is_active: newProfessional.is_active,
              created_at: newProfessional.created_at,
              email: ownerProfile.email || '',
              cpf: newProfessional.cpf || '',
              phone: newProfessional.phone || '',
              formation: newProfessional.formation || '',
              education: newProfessional.education || ''
            };
            
            processedData = [...processedData, ownerAsProfessional];
          }
        }
      }

      setProfessionals(processedData || []);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Erro ao buscar profissionais',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, clinic, clinicLoading, toast]);

  useEffect(() => {
    if (!authLoading && !clinicLoading) {
      fetchProfessionals();
    }
  }, [fetchProfessionals, authLoading, clinicLoading]);

  const handleAddProfessional = async () => {
    if (!user || !clinic) {
      toast({ title: "Erro", description: "Usuário ou clínica não encontrados. Tente recarregar a página.", variant: "destructive" });
      return;
    }

    // Validação básica dos campos
    if (!newProfessional.email || !newProfessional.full_name || !newProfessional.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o e-mail, nome completo e senha.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        professionalData: newProfessional,
        clinicId: clinic.id,
      };

      console.log('DEBUG: Enviando payload para create-professional-user:', JSON.stringify(payload, null, 2));

      const { error } = await supabase.functions.invoke('create-professional-user', {
        body: payload,
      });

      if (error) {
        // O erro já será um objeto com a estrutura da EdgeFunctionError
        throw error;
      }

      toast({
        title: 'Profissional Adicionado!',
        description: 'O novo profissional foi cadastrado com sucesso.',
      });

      setShowAddModal(false);
      fetchProfessionals(); // Refresh list
      setNewProfessional({ email: '', full_name: '', cpf: '', formation: '', phone: '', password: '', specialty: '', council_number: '' });

    } catch (error: unknown) {
      // Definir interface para o tipo de erro esperado da Edge Function
      interface EdgeFunctionError {
        message: string;
        details?: string;
      }
      
      const edgeFunctionError = error as EdgeFunctionError;
      console.error('DEBUG: Erro recebido da Edge Function:', edgeFunctionError);

      let errorMessage = 'Ocorreu um erro desconhecido.';

      // Tratamento de erro melhorado
      if (edgeFunctionError?.details) {
        errorMessage = edgeFunctionError.details;
      } else if (typeof edgeFunctionError?.message === 'string') {
        errorMessage = edgeFunctionError.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao adicionar profissional',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (professional: Professional) => {
    setEditingProfessional(professional);
    setEditFormData({
      full_name: professional.full_name || '',
      cpf: professional.cpf || '',
      phone: professional.phone || '',
      formation: professional.formation || '',
      specialty: professional.specialty || '',
      council_number: professional.council_number || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (professional: Professional) => {
    setDeletingProfessional(professional);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProfessional) return;
    
    toast({
      title: 'Em desenvolvimento',
      description: 'A funcionalidade de excluir profissional está sendo implementada.',
    });
    setShowDeleteConfirm(false);
    setDeletingProfessional(null);
  };

  const handleUpdateProfessional = async () => {
    if (!editingProfessional) return;

    try {
      const { error } = await supabase.functions.invoke('update-professional-user', {
        body: { 
          user_id: editingProfessional.user_id,
          professional_id: editingProfessional.id,
          ...editFormData 
        },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Profissional atualizado com sucesso.',
      });
      setShowEditModal(false);
      setEditingProfessional(null);
      fetchProfessionals(); // Refresh list
    } catch (error) {
      toast({
        title: 'Erro ao atualizar profissional',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const toggleProfessionalStatus = async (professional: Professional) => {
    const newStatus = !professional.is_active;
    const { error } = await supabase
      .from('professionals')
      .update({ is_active: newStatus })
      .eq('id', professional.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status atualizado!',
        description: `O profissional foi ${newStatus ? 'ativado' : 'desativado'}.`,
      });
      fetchProfessionals();
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('DEBUG: Estado atual dos profissionais antes da renderização:', professionals);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciar Profissionais
        </h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Profissional
        </Button>
      </div>

      {professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((professional) => (
            <Card key={professional.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold truncate">{professional.full_name}</span>
                  <Badge variant={professional.is_active ? 'default' : 'secondary'}>
                    {professional.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500">{professional.email}</p>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-gray-500">{professional.specialty || 'Sem especialidade'}</p>
                <p className="text-xs text-gray-400">Conselho: {professional.council_number || 'N/A'}</p>
              </CardContent>
              <div className="flex items-center justify-between border-t p-3 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleProfessionalStatus(professional)}
                  className="text-xs px-2 h-8"
                >
                  {professional.is_active ? <UserX className="mr-1 h-4 w-4" /> : <UserCheck className="mr-1 h-4 w-4" />}
                  {professional.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(professional)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(professional)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Adicione profissionais à sua clínica para começar
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Profissional
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Adicionar Profissional */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Profissional</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={newProfessional.email} onChange={(e) => setNewProfessional(prev => ({ ...prev, email: e.target.value }))} placeholder="profissional@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input id="full_name" value={newProfessional.full_name} onChange={(e) => setNewProfessional(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Nome do profissional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" type="password" value={newProfessional.password} onChange={(e) => setNewProfessional(prev => ({ ...prev, password: e.target.value }))} placeholder="Senha de acesso" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={newProfessional.cpf} onChange={(e) => setNewProfessional(prev => ({ ...prev, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" value={newProfessional.phone} onChange={(e) => setNewProfessional(prev => ({ ...prev, phone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formation">Formação</Label>
              <Input id="formation" value={newProfessional.formation} onChange={(e) => setNewProfessional(prev => ({ ...prev, formation: e.target.value }))} placeholder="Ex: Fisioterapia" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input id="specialty" value={newProfessional.specialty} onChange={(e) => setNewProfessional(prev => ({ ...prev, specialty: e.target.value }))} placeholder="Ex: Pilates" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="council_number">Nº do Conselho</Label>
              <Input id="council_number" value={newProfessional.council_number} onChange={(e) => setNewProfessional(prev => ({ ...prev, council_number: e.target.value }))} placeholder="Ex: CREFITO 12345" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddProfessional}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {editingProfessional && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input id="edit_email" type="email" value={editingProfessional.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input id="edit_full_name" value={editFormData.full_name} onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_cpf">CPF</Label>
                <Input id="edit_cpf" value={editFormData.cpf} onChange={(e) => setEditFormData(prev => ({ ...prev, cpf: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Telefone</Label>
                <Input id="edit_phone" type="tel" value={editFormData.phone} onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_formation">Formação</Label>
                <Input id="edit_formation" value={editFormData.formation} onChange={(e) => setEditFormData(prev => ({ ...prev, formation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_specialty">Especialidade</Label>
                <Input id="edit_specialty" value={editFormData.specialty} onChange={(e) => setEditFormData(prev => ({ ...prev, specialty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_council_number">Nº do Conselho</Label>
                <Input id="edit_council_number" value={editFormData.council_number} onChange={(e) => setEditFormData(prev => ({ ...prev, council_number: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingProfessional(null); }}>Cancelar</Button>
              <Button onClick={handleUpdateProfessional}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      {deletingProfessional && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o profissional{' '}
                <strong>{deletingProfessional.full_name}</strong>
                {' '}e todos os seus dados associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDeleteConfirm(false); setDeletingProfessional(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default GerenciarProfissionais;
