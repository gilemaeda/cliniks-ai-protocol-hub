
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import HistoricoSaudeGeral from './HistoricoSaudeGeral';
import EstiloDeVida from './EstiloDeVida';
import AvaliacaoFacial from './AvaliacaoFacial';
import AvaliacaoCorporal from './AvaliacaoCorporal';
import AvaliacaoCapilar from './AvaliacaoCapilar';
import MedidasCorporais from './MedidasCorporais';

interface AnamnesisFormTabsProps {
  selectedArea: 'facial' | 'corporal' | 'capilar';
  formData: {
    historicoSaudeGeral: any;
    estiloDeVida: any;
    avaliacaoFacial: any;
    avaliacaoCorporal: any;
    avaliacaoCapilar: any;
    medidasCorporais: any;
  };
  onUpdateFormData: (section: string, data: any) => void;
}

const AnamnesisFormTabs = ({ selectedArea, formData, onUpdateFormData }: AnamnesisFormTabsProps) => {
  const getGridCols = () => {
    switch (selectedArea) {
      case 'facial':
        return 'grid-cols-3';
      case 'corporal':
        return 'grid-cols-4';
      case 'capilar':
        return 'grid-cols-3';
      default:
        return 'grid-cols-3';
    }
  };

  const getTabIcon = (tabValue: string) => {
    switch (tabValue) {
      case 'saude':
        return '🏥';
      case 'estilo':
        return '🏃‍♀️';
      case 'facial':
        return '👤';
      case 'corporal':
        return '💪';
      case 'medidas':
        return '📏';
      case 'capilar':
        return '💇‍♀️';
      default:
        return '📋';
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="saude" className="w-full">
        <TabsList className={`grid w-full ${getGridCols()} mb-6`}>
          <TabsTrigger value="saude" className="flex items-center gap-2 text-sm">
            <span>{getTabIcon('saude')}</span>
            Saúde Geral
          </TabsTrigger>
          <TabsTrigger value="estilo" className="flex items-center gap-2 text-sm">
            <span>{getTabIcon('estilo')}</span>
            Estilo de Vida
          </TabsTrigger>
          
          {selectedArea === 'facial' && (
            <TabsTrigger value="facial" className="flex items-center gap-2 text-sm">
              <span>{getTabIcon('facial')}</span>
              Avaliação Facial
            </TabsTrigger>
          )}
          
          {selectedArea === 'corporal' && (
            <>
              <TabsTrigger value="corporal" className="flex items-center gap-2 text-sm">
                <span>{getTabIcon('corporal')}</span>
                Avaliação Corporal
              </TabsTrigger>
              <TabsTrigger value="medidas" className="flex items-center gap-2 text-sm">
                <span>{getTabIcon('medidas')}</span>
                Medidas
              </TabsTrigger>
            </>
          )}
          
          {selectedArea === 'capilar' && (
            <TabsTrigger value="capilar" className="flex items-center gap-2 text-sm">
              <span>{getTabIcon('capilar')}</span>
              Avaliação Capilar
            </TabsTrigger>
          )}
        </TabsList>

        <div className="space-y-6">
          <TabsContent value="saude" className="space-y-0 m-0">
            <HistoricoSaudeGeral
              data={formData.historicoSaudeGeral}
              onChange={(data) => onUpdateFormData('historicoSaudeGeral', data)}
            />
          </TabsContent>

          <TabsContent value="estilo" className="space-y-0 m-0">
            <EstiloDeVida
              data={formData.estiloDeVida}
              onChange={(data) => onUpdateFormData('estiloDeVida', data)}
            />
          </TabsContent>

          {selectedArea === 'facial' && (
            <TabsContent value="facial" className="space-y-0 m-0">
              <AvaliacaoFacial
                data={formData.avaliacaoFacial}
                onChange={(data) => onUpdateFormData('avaliacaoFacial', data)}
              />
            </TabsContent>
          )}

          {selectedArea === 'corporal' && (
            <>
              <TabsContent value="corporal" className="space-y-0 m-0">
                <AvaliacaoCorporal
                  data={formData.avaliacaoCorporal}
                  onChange={(data) => onUpdateFormData('avaliacaoCorporal', data)}
                />
              </TabsContent>
              <TabsContent value="medidas" className="space-y-0 m-0">
                <MedidasCorporais
                  data={formData.medidasCorporais}
                  onChange={(data) => onUpdateFormData('medidasCorporais', data)}
                />
              </TabsContent>
            </>
          )}

          {selectedArea === 'capilar' && (
            <TabsContent value="capilar" className="space-y-0 m-0">
              <AvaliacaoCapilar
                data={formData.avaliacaoCapilar}
                onChange={(data) => onUpdateFormData('avaliacaoCapilar', data)}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </Card>
  );
};

export default AnamnesisFormTabs;
