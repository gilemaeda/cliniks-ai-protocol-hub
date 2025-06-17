
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EquipamentosManager from '@/components/recursos/EquipamentosManager';
import CosmeticosManager from '@/components/recursos/CosmeticosManager';
import InjetaveisManager from '@/components/recursos/InjetaveisManager';

const CentralRecursos = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('equipamentos');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Central de Equipamentos & Produtos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie todos os recursos disponíveis na sua clínica
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="cosmeticos">Produtos Cosméticos</TabsTrigger>
            <TabsTrigger value="injetaveis">Produtos Injetáveis</TabsTrigger>
          </TabsList>

          <TabsContent value="equipamentos">
            <EquipamentosManager />
          </TabsContent>

          <TabsContent value="cosmeticos">
            <CosmeticosManager />
          </TabsContent>

          <TabsContent value="injetaveis">
            <InjetaveisManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CentralRecursos;
