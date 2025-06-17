
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ConfiguracoesProfissional = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [equipments, setEquipments] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'professional') {
      fetchEquipments();
    }
  }, [user, profile]);

  const fetchEquipments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('equipment_list')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar equipamentos:', error);
        return;
      }

      setEquipments(data?.equipment_list || []);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim() && !equipments.includes(newEquipment.trim())) {
      setEquipments([...equipments, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (equipment: string) => {
    setEquipments(equipments.filter(eq => eq !== equipment));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          equipment_list: equipments
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "Sua lista de equipamentos foi atualizada"
      });
    } catch (error) {
      console.error('Erro ao salvar equipamentos:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'professional') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Configurações disponíveis apenas para profissionais
          </p>
        </CardContent>
      </Card>
    );
  }

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações do Profissional
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Configure sua lista de equipamentos estéticos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Equipamentos Estéticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="Nome do equipamento"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddEquipment();
                }
              }}
            />
            <Button onClick={handleAddEquipment} disabled={!newEquipment.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Equipamentos Cadastrados</Label>
            {equipments.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Nenhum equipamento cadastrado ainda
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {equipments.map((equipment, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {equipment}
                    <button
                      onClick={() => handleRemoveEquipment(equipment)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesProfissional;
