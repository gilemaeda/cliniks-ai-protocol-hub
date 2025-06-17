import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Brain, History, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import NovaAvaliacao from '@/components/avaliacao-ia/NovaAvaliacao';
import HistoricoAvaliacoes from '@/components/avaliacao-ia/HistoricoAvaliacoes';
import ConfiguracoesProfissional from '@/components/avaliacao-ia/ConfiguracoesProfissional';
import FormularioAvaliacao from '@/components/avaliacao-ia/FormularioAvaliacao';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const AvaliacaoIA = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('nova-avaliacao');
  const queryClient = useQueryClient();
  const params = useParams();

  // Verificar se há um tipo específico de avaliação na URL via parâmetro de rota
  const assessmentTypeFromRoute = params['*'] as 'facial' | 'corporal' | 'capilar' | null;
  
  // Verificar se há um tipo específico de avaliação na URL via query params (retrocompatibilidade)
  const assessmentTypeFromQuery = searchParams.get('type') as 'facial' | 'corporal' | 'capilar' | null;
  
  // Combinar ambas as fontes, dando prioridade para o parâmetro de rota
  const assessmentType = assessmentTypeFromRoute || assessmentTypeFromQuery;
  
  // Verificar se está em modo de edição ou clonagem
  const isEditMode = searchParams.get('edit') === 'true';
  const isCloneMode = searchParams.get('clone') === 'true';
  const assessmentId = searchParams.get('id');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      
      // Se estiver navegando para a aba de histórico, invalidar a query de avaliações
      if (tab === 'historico' && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
      }
    }
  }, [searchParams, queryClient, user?.id]);

  // Se há um tipo específico, ir direto para o formulário
  if (assessmentType && ['facial', 'corporal', 'capilar'].includes(assessmentType)) {
    let pageTitle;
    let pageDescription;
    
    if (isEditMode) {
      pageTitle = `Editar Avaliação ${assessmentType === 'facial' ? 'Facial' : assessmentType === 'corporal' ? 'Corporal' : 'Capilar'}`;
      pageDescription = 'Edite os dados da avaliação existente';
    } else if (isCloneMode) {
      pageTitle = `Clonar Avaliação ${assessmentType === 'facial' ? 'Facial' : assessmentType === 'corporal' ? 'Corporal' : 'Capilar'}`;
      pageDescription = 'Crie uma nova avaliação baseada em outra existente';
    } else {
      pageTitle = assessmentType === 'facial' ? 'Avaliação Facial' : assessmentType === 'corporal' ? 'Avaliação Corporal' : 'Avaliação Capilar';
      pageDescription = 'Gere protocolos personalizados com inteligência artificial';
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/avaliacao-ia')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {pageTitle}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {pageDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <FormularioAvaliacao 
            assessmentType={assessmentType}
            onBack={() => navigate('/avaliacao-ia')}
            onSuccess={() => {
              // Invalidar a query de avaliações antes de navegar para o histórico
              if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
              }
              navigate('/avaliacao-ia?tab=historico');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Avaliação Inteligente (IA)
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Gerencie suas avaliações com inteligência artificial
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${profile?.role === 'professional' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="nova-avaliacao" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Nova Avaliação</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
            {profile?.role === 'professional' && (
              <TabsTrigger value="configuracoes" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="nova-avaliacao">
            <NovaAvaliacao />
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoAvaliacoes />
          </TabsContent>

          {profile?.role === 'professional' && (
            <TabsContent value="configuracoes">
              <ConfiguracoesProfissional />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AvaliacaoIA;
