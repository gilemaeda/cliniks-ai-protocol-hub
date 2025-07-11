import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Brain, History, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { usePageState } from '@/hooks/usePageState';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useToast } from '@/hooks/use-toast';
import NovaAvaliacao from '@/components/avaliacao-ia/NovaAvaliacao';
import HistoricoAvaliacoes from '@/components/avaliacao-ia/HistoricoAvaliacoes';
import ConfiguracoesProfissional from '@/components/avaliacao-ia/ConfiguracoesProfissional';
import FormularioAvaliacao from '@/components/avaliacao-ia/FormularioAvaliacao';
import { useAuth } from '@/hooks/auth/authContext';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const AvaliacaoIA = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const params = useParams();
  const { restoreState } = usePageState();
  const { toast } = useToast();
  
  // Usar o hook usePersistentState para persistir a aba ativa
  const [activeTab, setActiveTab, clearActiveTab] = usePersistentState<string>(
    'cliniks_avaliacao_tab',
    'nova-avaliacao'
  );

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

  // Função para atualizar a aba ativa e os parâmetros de URL sem recarregar a página
  const handleTabChange = useCallback((value: string) => {
    // Atualizar o estado persistente (isso já salva no localStorage)
    setActiveTab(value);
    
    // Atualizar os parâmetros de URL sem recarregar a página
    setSearchParams({ tab: value }, { replace: true });
    
    // Se estiver navegando para a aba de histórico, invalidar a query de avaliações
    if (value === 'historico' && user?.id) {
      queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
    }
  }, [setActiveTab, setSearchParams, queryClient, user?.id]);
  
  // Função para lidar com a restauração da página do BFCache
  const handlePageShow = useCallback((event: PageTransitionEvent) => {
    if (event.persisted) {
      console.log('Página de Avaliação IA restaurada do BFCache');
      toast({
        title: 'Página restaurada',
        description: 'Seu estado foi recuperado automaticamente.',
        variant: 'default',
      });
      
      // O estado da aba já é restaurado automaticamente pelo usePersistentState
      
      // Se estiver na aba de histórico, invalidar a query de avaliações
      if (activeTab === 'historico' && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
      }
    }
  }, [activeTab, toast, queryClient, user?.id]);
  
  // Sincronizar o estado local com os parâmetros de URL ao carregar a página
  useEffect(() => {
    // Primeiro verificar se há um parâmetro de URL
    const tab = searchParams.get('tab');
    
    if (tab) {
      // Se há um parâmetro na URL, ele tem prioridade
      setActiveTab(tab);
      
      // Se estiver navegando para a aba de histórico, invalidar a query de avaliações
      if (tab === 'historico' && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
      }
    } else {
      // Se não houver parâmetro na URL, usar o valor do estado persistente (já carregado do localStorage)
      // e atualizar a URL para refletir esse estado
      setSearchParams({ tab: activeTab }, { replace: true });
      
      // Se estiver restaurando para a aba de histórico, invalidar a query de avaliações
      if (activeTab === 'historico' && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
      }
    }
  }, [activeTab, queryClient, searchParams, setActiveTab, setSearchParams, user?.id]);
  
  // Adicionar e remover o event listener para pageshow
  useEffect(() => {
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [handlePageShow]);

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
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
