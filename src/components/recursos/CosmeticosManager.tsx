
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

const CosmeticosManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [cosmeticos, setCosmeticos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinic, setClinic] = useState(null);
  const { customCategories, addCustomCategory } = useCustomCategories('cosmetic');

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

  const categoriasDisponiveis = [
    'Limpeza',
    'Esfoliante',
    'Máscara',
    'Sérum/Concentrado',
    'Creme/Gel',
    'Protetor Solar',
    'Pós-procedimento',
    'Capilar',
    ...customCategories
  ];

  const areasDisponiveis = ['Facial', 'Corporal', 'Capilar'];

  useEffect(() => {
    if (user) {
      fetchCosmeticos();
    }
  }, [user]);

  const fetchCosmeticos = async () => {
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
          .eq('resource_type', 'cosmetic')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCosmeticos(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar cosméticos:', error);
      toast({
        title: "Erro ao carregar cosméticos",
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
        description: "Informe o nome do cosmético",
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
      const cosmeticData = {
        ...formData,
        clinic_id: clinic.id,
        created_by: user?.id,
        resource_type: 'cosmetic'
      };

      if (editingItem) {
        const { error } = await supabase
          .from('clinic_resources')
          .update(cosmeticData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Cosmético atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('clinic_resources')
          .insert(cosmeticData);

        if (error) throw error;
        toast({ title: "Cosmético cadastrado com sucesso!" });
      }

      resetForm();
      fetchCosmeticos();
    } catch (error) {
      console.error('Erro ao salvar cosmético:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cosmético",
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

  const handleEdit = (cosmetico) => {
    setFormData({
      name: cosmetico.name,
      category: cosmetico.category || '',
      main_actives: cosmetico.main_actives || '',
      purpose: cosmetico.purpose || '',
      contraindications: cosmetico.contraindications || '',
      usage_areas: cosmetico.usage_areas || [],
      usage_type: cosmetico.usage_type || 'internal',
      availability: cosmetico.availability || 'in_stock',
      observations: cosmetico.observations || ''
    });
    setEditingItem(cosmetico);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cosmético?')) return;

    try {
      const { error } = await supabase
        .from('clinic_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Cosmético excluído com sucesso!" });
      fetchCosmeticos();
    } catch (error) {
      console.error('Erro ao excluir cosmético:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cosmético",
        variant: "destructive"
      });
    }
  };

  const filteredCosmeticos = cosmeticos.filter(cosmetico =>
    cosmetico.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cosmetico.category && cosmetico.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cosmetico.main_actives && cosmetico.main_actives.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Produtos Cosméticos</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCustomForm(true)}
          >
            + Categoria
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cosmético
          </Button>
        </div>
      </div>

      {showCustomForm && (
        <CustomTypeForm
          title="Adicionar Nova Categoria"
          onAdd={(value) => {
            const success = addCustomCategory(value);
            if (success) {
              setShowCustomForm(false);
              toast({
                title: "Categoria adicionada!",
                description: `A categoria "${value}" foi adicionada com sucesso.`
              });
            } else {
              toast({
                title: "Categoria já existe",
                description: "Esta categoria já foi adicionada anteriormente.",
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
              {editingItem ? 'Editar Cosmético' : 'Novo Cosmético'}
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
                    placeholder="Ex: Vitamina C 20%"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDisponiveis.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
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
                    placeholder="Ex: Ácido Hialurônico, Vitamina C"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Finalidade / Indicação</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    placeholder="Ex: Hidratação, Anti-idade"
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
          placeholder="Buscar cosméticos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8">
          <p>Carregando cosméticos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCosmeticos.map((cosmetico) => (
            <ResourceCard
              key={cosmetico.id}
              resource={cosmetico}
              onEdit={handleEdit}
              onDelete={handleDelete}
              resourceType="cosmetic"
            />
          ))}
        </div>
      )}

      {!loading && filteredCosmeticos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Nenhum cosmético encontrado' : 'Nenhum cosmético cadastrado'}
        </div>
      )}
    </div>
  );
};

export default CosmeticosManager;
