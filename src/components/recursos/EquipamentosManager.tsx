
import React, { useState } from 'react';
import { useEquipmentsQuery } from '@/hooks/useEquipmentsQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Search } from 'lucide-react';
import { useCustomCategories } from './hooks/useCustomCategories';
import ResourceForm from './components/ResourceForm';
import ResourceCard from './components/ResourceCard';
import CustomTypeForm from './components/CustomTypeForm';

const EquipamentosManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicId, setClinicId] = useState<string | null>(null);
  const { customCategories, addCustomCategory, removeCustomCategory } = useCustomCategories('equipment');

  const { data: equipamentos = [], isLoading: loading, error, refetch } = useEquipmentsQuery(user?.id);

  // Buscar clinic_id quando necessário
  React.useEffect(() => {
    const fetchClinicId = async () => {
      if (!user?.id || clinicId) return;

      try {
        const { data, error } = await supabase.rpc('get_user_clinic_data', {
          user_uuid: user.id
        });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setClinicId(data[0].clinic_id);
        }
      } catch (error) {
        console.error('Erro ao buscar clinic_id:', error);
      }
    };

    fetchClinicId();
  }, [user?.id, clinicId]);

  // Mutations para criar/editar/excluir
  const mutationUpsert = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        // update
        const { error } = await supabase
          .from('clinic_resources')
          .update(payload)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_resources')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      resetForm();
      toast({ title: 'Equipamento salvo com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao salvar equipamento:', error);
      toast({ title: 'Erro ao salvar', description: 'Não foi possível salvar o equipamento', variant: 'destructive' });
    }
  });

  const mutationDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinic_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      toast({ title: 'Equipamento excluído com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao excluir equipamento:', error);
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir o equipamento', variant: 'destructive' });
    }
  });

  if (error) {
    toast({
      title: "Erro ao carregar equipamentos",
      description: error.message,
      variant: "destructive"
    });
  }

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand_model: '',
    usage_areas: [],
    usage_type: 'internal',
    availability: 'in_stock',
    observations: ''
  });

  const finalidadesDisponiveis = [
    'Radiofrequência',
    'Ultrassom',
    'Criolipólise',
    'Laser',
    'LED Terapia',
    'Pressoterapia',
    'Drenagem Linfática',
    'Eletroestimulação',
    'Cavitação',
    'Microagulhamento',
    ...customCategories
  ];

  const areasDisponiveis = ['Facial', 'Corporal', 'Capilar'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAreaChange = (area, checked) => {
    setFormData(prev => ({
      ...prev,
      usage_areas: checked 
        ? [...prev.usage_areas, area]
        : prev.usage_areas.filter(a => a !== area)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do equipamento",
        variant: "destructive"
      });
      return;
    }

    // Usar clinicId do state ou do equipamento sendo editado
    const targetClinicId = editingItem?.clinic_id || clinicId || equipamentos[0]?.clinic_id;
    
    if (!targetClinicId) {
      toast({
        title: "Erro de configuração",
        description: "Clínica não identificada",
        variant: "destructive"
      });
      return;
    }

    const payload = {
      ...formData,
      id: editingItem?.id,
      clinic_id: targetClinicId,
      resource_type: 'equipment',
    };

    mutationUpsert.mutate(payload);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand_model: '',
      usage_areas: [],
      usage_type: 'internal',
      availability: 'in_stock',
      observations: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (equipamento) => {
    setFormData({
      name: equipamento.name,
      category: equipamento.category || '',
      brand_model: equipamento.brand_model || '',
      usage_areas: equipamento.usage_areas || [],
      usage_type: equipamento.usage_type || 'internal',
      availability: equipamento.availability || 'in_stock',
      observations: equipamento.observations || ''
    });
    setEditingItem(equipamento);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
    mutationDelete.mutate(id);
  };

  const filteredEquipamentos = equipamentos.filter(equipamento =>
    equipamento.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (equipamento.category && equipamento.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Equipamentos</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCustomForm(true)}
          >
            + Finalidade
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {showCustomForm && (
        <CustomTypeForm
          title="Adicionar Nova Finalidade"
          onAdd={addCustomCategory}
          onClose={() => setShowCustomForm(false)}
        />
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Editar Equipamento' : 'Novo Equipamento'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Equipamento</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Radiofrequência Facial"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Finalidade / Uso</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a finalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {finalidadesDisponiveis.map((finalidade) => (
                        <SelectItem key={finalidade} value={finalidade}>
                          {finalidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_model">Marca / Modelo (Opcional)</Label>
                <Input
                  id="brand_model"
                  value={formData.brand_model}
                  onChange={(e) => handleInputChange('brand_model', e.target.value)}
                  placeholder="Ex: HTM RF Plus"
                />
              </div>

              <ResourceForm
                formData={formData}
                onInputChange={handleInputChange}
                onAreaChange={handleAreaChange}
                areasDisponiveis={areasDisponiveis}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                loading={mutationUpsert.isPending}
                editingItem={!!editingItem}
              >
                <div></div>
              </ResourceForm>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar equipamentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8">
          <p>Carregando equipamentos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipamentos.map((equipamento) => (
            <ResourceCard
              key={equipamento.id}
              resource={equipamento}
              onEdit={handleEdit}
              onDelete={handleDelete}
              resourceType="equipment"
            />
          ))}
        </div>
      )}

      {!loading && filteredEquipamentos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
        </div>
      )}
    </div>
  );
};

export default EquipamentosManager;
