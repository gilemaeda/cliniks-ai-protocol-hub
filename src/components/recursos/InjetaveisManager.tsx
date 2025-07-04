
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search } from 'lucide-react';
import { useCustomCategories } from './hooks/useCustomCategories';
import ResourceForm from './components/ResourceForm';
import ResourceCard from './components/ResourceCard';
import CustomTypeForm from './components/CustomTypeForm';

const InjetaveisManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [injetaveis, setInjetaveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinic, setClinic] = useState(null);
  const { customCategories, addCustomCategory } = useCustomCategories('injectable');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    main_actives: '',
    purpose: '',
    contraindications: '',
    usage_areas: [],
    usage_type: 'internal',
    availability: 'in_stock',
    observations: ''
  });

  const tiposDisponiveis = [
    'Toxina Botulínica',
    'Preenchedor',
    'Bioestimulador',
    'Enzimas',
    'Vitaminas',
    'Outros',
    ...customCategories
  ];

  const areasDisponiveis = ['Facial', 'Corporal', 'Capilar'];

  useEffect(() => {
    if (user) {
      fetchInjetaveis();
    }
  }, [user]);

  const fetchInjetaveis = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (clinicData && clinicData.length > 0) {
        const clinicId = clinicData[0].clinic_id;
        setClinic({ id: clinicId });

        const { data, error } = await supabase
          .from('clinic_resources')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('resource_type', 'injectable')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInjetaveis(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar injetáveis:', error);
      toast({
        title: "Erro ao carregar injetáveis",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
        description: "Informe o nome do injetável",
        variant: "destructive"
      });
      return;
    }

    if (!clinic?.id) {
      toast({
        title: "Erro de configuração",
        description: "Clínica não identificada",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const injectableData = {
        ...formData,
        clinic_id: clinic.id,
        created_by: user?.id,
        resource_type: 'injectable'
      };

      if (editingItem) {
        const { error } = await supabase
          .from('clinic_resources')
          .update(injectableData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Injetável atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('clinic_resources')
          .insert(injectableData);

        if (error) throw error;
        toast({ title: "Injetável cadastrado com sucesso!" });
      }

      resetForm();
      fetchInjetaveis();
    } catch (error) {
      console.error('Erro ao salvar injetável:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o injetável",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      main_actives: '',
      purpose: '',
      contraindications: '',
      usage_areas: [],
      usage_type: 'internal',
      availability: 'in_stock',
      observations: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (injetavel) => {
    setFormData({
      name: injetavel.name,
      category: injetavel.category || '',
      main_actives: injetavel.main_actives || '',
      purpose: injetavel.purpose || '',
      contraindications: injetavel.contraindications || '',
      usage_areas: injetavel.usage_areas || [],
      usage_type: injetavel.usage_type || 'internal',
      availability: injetavel.availability || 'in_stock',
      observations: injetavel.observations || ''
    });
    setEditingItem(injetavel);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este injetável?')) return;

    try {
      const { error } = await supabase
        .from('clinic_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Injetável excluído com sucesso!" });
      fetchInjetaveis();
    } catch (error) {
      console.error('Erro ao excluir injetável:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o injetável",
        variant: "destructive"
      });
    }
  };

  const filteredInjetaveis = injetaveis.filter(injetavel =>
    injetavel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (injetavel.category && injetavel.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (injetavel.main_actives && injetavel.main_actives.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Produtos Injetáveis</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCustomForm(true)}
          >
            + Tipo
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Injetável
          </Button>
        </div>
      </div>

      {showCustomForm && (
        <CustomTypeForm
          title="Adicionar Novo Tipo"
          onAdd={(value) => {
            const success = addCustomCategory(value);
            if (success) {
              setShowCustomForm(false);
              toast({
                title: "Tipo adicionado!",
                description: `O tipo "${value}" foi adicionado com sucesso.`
              });
            } else {
              toast({
                title: "Tipo já existe",
                description: "Este tipo já foi adicionado anteriormente.",
                variant: "destructive"
              });
            }
            return success;
          }}
          onClose={() => setShowCustomForm(false)}
        />
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Editar Injetável' : 'Novo Injetável'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Comercial</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Botox 100U"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Tipo</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDisponiveis.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="main_actives">Ativos Principais</Label>
                  <Input
                    id="main_actives"
                    value={formData.main_actives}
                    onChange={(e) => handleInputChange('main_actives', e.target.value)}
                    placeholder="Ex: Toxina Botulínica Tipo A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Finalidade / Indicação</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    placeholder="Ex: Relaxamento muscular, Preenchimento"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraindications">Contraindicações Comuns</Label>
                <Textarea
                  id="contraindications"
                  value={formData.contraindications}
                  onChange={(e) => handleInputChange('contraindications', e.target.value)}
                  placeholder="Descreva as principais contraindicações"
                  rows={3}
                />
              </div>

              <ResourceForm
                formData={formData}
                onInputChange={handleInputChange}
                onAreaChange={handleAreaChange}
                areasDisponiveis={areasDisponiveis}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                loading={loading}
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
          placeholder="Buscar injetáveis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8">
          <p>Carregando injetáveis...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInjetaveis.map((injetavel) => (
            <ResourceCard
              key={injetavel.id}
              resource={injetavel}
              onEdit={handleEdit}
              onDelete={handleDelete}
              resourceType="injectable"
            />
          ))}
        </div>
      )}

      {!loading && filteredInjetaveis.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Nenhum injetável encontrado' : 'Nenhum injetável cadastrado'}
        </div>
      )}
    </div>
  );
};

export default InjetaveisManager;
