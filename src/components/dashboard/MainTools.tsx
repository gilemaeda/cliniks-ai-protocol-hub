
import React, { Suspense, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Sparkles, Package, Users, Camera, User, Brain, FileText, MessageCircle, History, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/auth/authContext';
import { useClinic } from '@/hooks/useClinic';
import { useEffect, useState, ElementType } from 'react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PlanStatusBanner from './PlanStatusBanner';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  color: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}

// Função para navegação segura
const safeNavigate = (navigate: ReturnType<typeof useNavigate>, path: string) => {
  try {
    navigate(path);
  } catch (error) {
    console.error('Erro ao navegar:', error);
    // Se a navegação falhar, tenta recarregar a página com a rota desejada
    window.location.href = path;
  }
};

// Componente interno que usa os hooks
const MainToolsContent = () => {
  let navigate: ReturnType<typeof useNavigate>;
  let location: ReturnType<typeof useLocation>;
  
  // Envolver os hooks em try-catch para capturar erros de contexto
  try {
    navigate = useNavigate();
    location = useLocation();
  } catch (error) {
    console.error('Erro ao acessar contexto do Router:', error);
    // Fallback: usar window.location para navegação
    navigate = ((path: string) => {
      window.location.href = path;
    }) as any;
    location = { pathname: window.location.pathname } as any;
  }

  const { profile } = useAuth();
  const { canAccess, blockReason, isChecking } = useAccessControl();
  const { planStatus, trialDaysRemaining } = useClinic();
  const [tools, setTools] = useState<Tool[]>([]);

  // Usar useCallback para memoizar as funções de navegação
  const handleNavigation = useCallback((path: string) => {
    safeNavigate(navigate, path);
  }, [navigate]);

  useEffect(() => {
    const baseTools = [
      {
        id: 'avaliacao-facial',
        title: 'Avaliação Facial',
        description: 'Análise completa Facial com IA',
        icon: User,
        color: 'bg-[#7f00fa]/10',
        badge: 'IA',
        badgeColor: 'bg-[#7f00fa]',
        onClick: () => handleNavigation('/avaliacao-ia/facial')
      },
      {
        id: 'avaliacao-corporal',
        title: 'Avaliação Corporal',  
        description: 'Avaliação corporal inteligente e personalizada',
        icon: Brain,
        color: 'bg-[#fb0082]/10',
        badge: 'IA',
        badgeColor: 'bg-[#fb0082]',
        onClick: () => handleNavigation('/avaliacao-ia/corporal')
      },
      {
        id: 'avaliacao-capilar',
        title: 'Avaliação Capilar',
        description: 'Análise tricológica com inteligência artificial',
        icon: Sparkles,
        color: 'bg-[#0ff0b3]/10',
        badge: 'IA',
        badgeColor: 'bg-[#0ff0b3]',
        onClick: () => handleNavigation('/avaliacao-ia/capilar')
      },
      {
        id: 'chat-ia',
        title: 'Chat IA Especializada',
        description: 'Converse com a IA para tirar dúvidas sobre estética',
        icon: MessageCircle,
        color: 'bg-[#7f00fa]/10',
        badge: 'IA',
        badgeColor: 'bg-[#7f00fa]',
        onClick: () => handleNavigation('/chat-ia')
      },
      {
        id: 'historico-avaliacoes',
        title: 'Histórico de Avaliações',
        description: 'Visualize e gerencie todas as avaliações realizadas',
        icon: History,
        color: 'bg-[#424242]/10',
        badge: 'Essencial',
        badgeColor: 'bg-[#424242]',
        onClick: () => handleNavigation('/avaliacao-ia?tab=historico')
      },
      {
        id: 'protocolos',
        title: 'Protocolos Personalizados',
        description: 'Crie protocolos únicos com IA especializada',
        icon: Clock,
        color: 'bg-[#fb0082]/10',
        badge: 'Premium',
        badgeColor: 'bg-gradient-to-r from-[#7f00fa] to-[#fb0082]',
        onClick: () => handleNavigation('/protocolos-personalizados')
      },
      {
        id: 'recursos',
        title: 'Central de Recursos',
        description: 'Gerencie equipamentos, produtos cosméticos e injetáveis',
        icon: Package,
        color: 'bg-[#0ff0b3]/10',
        badge: 'Essencial',
        badgeColor: 'bg-[#0ff0b3]',
        onClick: () => handleNavigation('/central-recursos')
      },
      {
        id: 'pacientes',
        title: 'Pacientes',
        description: 'Gerencie o cadastro e informações dos seus pacientes',
        icon: Users,
        color: 'bg-[#7f00fa]/10',
        onClick: () => handleNavigation('/patients')
      },
      {
        id: 'anamneses',
        title: 'Anamneses',
        description: 'Formulários específicos para cada tipo de avaliação',
        icon: FileText,
        color: 'bg-[#424242]/10',
        badge: 'Essencial',
        badgeColor: 'bg-[#424242]',
        onClick: () => handleNavigation('/anamneses')
      },
      {
        id: 'galeria',
        title: 'Galeria de Fotos',
        description: 'Organize e compare fotos de evolução dos tratamentos',
        icon: Camera,
        color: 'bg-[#fb0082]/10',
        badge: 'Novo',
        badgeColor: 'bg-[#fb0082]',
        onClick: () => handleNavigation('/galeria-fotos')
      }
    ];

    setTools(baseTools);
  }, [handleNavigation]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-white via-[#7f00fa]/5 to-[#fb0082]/5 rounded-xl shadow p-6">
        {profile?.role === 'clinic_owner' && (
          <PlanStatusBanner status={planStatus} daysRemaining={trialDaysRemaining} />
        )}
        <h2 className="text-2xl font-bold mb-2 text-[#424242]">Ferramentas Principais</h2>
        <p className="text-[#424242]/70 mb-6">
          Acesse as principais funcionalidades da plataforma
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TooltipProvider>
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              const isBlocked = !canAccess && !isChecking;

              const cardItself = (
                <div className="relative">
                  <Card
                    className={`hover:shadow-xl transition-all group ${isBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} border-0 relative overflow-hidden 
                    before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-[#7f00fa] before:via-[#fb0082] before:to-[#0ff0b3] before:-z-10 before:animate-gradient-slow before:blur-[0.5px] before:bg-[length:200%_200%]
                    after:absolute after:inset-[2px] after:bg-gradient-to-br after:from-white after:to-[#7f00fa]/5 after:rounded-[10px] after:-z-10 after:backdrop-blur-sm
                    animate-pulse-glow shadow-[0_0_15px_rgba(127,0,250,0.15)] hover:shadow-[0_0_30px_rgba(251,0,130,0.35)]`}
                    onClick={isBlocked ? undefined : tool.onClick}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${tool.id === 'avaliacao-facial' ? 'bg-[#7f00fa]' : 
                                         tool.id === 'avaliacao-corporal' ? 'bg-[#fb0082]' : 
                                         tool.id === 'avaliacao-capilar' ? 'bg-[#0ff0b3]' : 
                                         tool.id === 'chat-ia' ? 'bg-[#7f00fa]' : 
                                         tool.id === 'historico-avaliacoes' ? 'bg-[#424242]' : 
                                         tool.id === 'protocolos' ? 'bg-gradient-to-r from-[#7f00fa] to-[#fb0082]' : 
                                         tool.id === 'recursos' ? 'bg-[#0ff0b3]' : 
                                         tool.id === 'pacientes' ? 'bg-[#7f00fa]' : 
                                         tool.id === 'anamneses' ? 'bg-[#424242]' : 
                                         tool.color.replace('/10', '')} group-hover:scale-110 transition-transform shadow-lg`}>
                          <IconComponent className="h-6 w-6 text-white drop-shadow-md" />
                        </div>
                        {tool.badge && (
                          <Badge className={`text-white text-xs ${tool.badgeColor} shadow-sm`}>
                            {tool.badge}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1 text-[#424242]">{tool.title}</h3>
                      <p className="text-sm text-[#424242]/70 mb-4">
                        {tool.description}
                      </p>
                      <Button className="w-full bg-gradient-to-r from-[#7f00fa]/90 via-[#fb0082]/90 to-[#0ff0b3]/90 hover:from-[#7f00fa] hover:via-[#fb0082] hover:to-[#0ff0b3] text-white border-0 shadow-md hover:shadow-lg transition-all" variant="outline" size="sm" disabled={isBlocked}>
                        Acessar
                      </Button>
                    </CardContent>
                  </Card>
                  {isBlocked && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-xl z-20 pointer-events-none">
                      <Lock className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
              );

              if (isBlocked) {
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <div>{cardItself}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {blockReason === 'EXPIRED'
                          ? 'Seu plano expirou. Renove para ter acesso.'
                          : 'Assine um plano para liberar esta ferramenta.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div key={tool.id}>
                  {cardItself}
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

// Componente principal com fallback para erro de contexto
const MainTools = () => {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f00fa] mx-auto mb-4"></div>
          <p className="text-[#424242]/80">Carregando ferramentas...</p>
        </div>
      </div>
    }>
      <MainToolsContent />
    </Suspense>
  );
};

export default MainTools;
