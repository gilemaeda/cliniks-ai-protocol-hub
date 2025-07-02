
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  UserPlus, 
  FileText,
  Stethoscope,
  Sparkles,
  BarChart3,
  Lock
} from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const QuickActions = () => {
  const navigate = useNavigate();
  const { canAccess, blockReason, isChecking } = useAccessControl();

  const actions = [
    {
      title: 'Estatísticas da Clínica',
      description: 'Visualizar métricas e dados da clínica',
      icon: BarChart3,
      onClick: () => navigate('/estatisticas-clinica'),
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Nova Avaliação IA',
      description: 'Criar protocolo com inteligência artificial',
      icon: Brain,
      onClick: () => navigate('/avaliacao-ia'),
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Protocolo Personalizado',
      description: 'Criar protocolo único com IA',
      icon: Sparkles,
      onClick: () => navigate('/protocolos-personalizados'),
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Novo Paciente',
      description: 'Cadastrar novo paciente no sistema',
      icon: UserPlus,
      onClick: () => navigate('/patients'),
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Nova Anamnese',
      description: 'Iniciar questionário de anamnese',
      icon: Stethoscope,
      onClick: () => navigate('/anamneses'),
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Central de Recursos',
      description: 'Gerenciar equipamentos e produtos',
      icon: FileText,
      onClick: () => navigate('/central-recursos'),
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Ações Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              const isBlocked = !canAccess && !isChecking;

              const buttonItself = (
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start hover:bg-gray-50 dark:hover:bg-gray-800 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={isBlocked ? undefined : action.onClick}
                  disabled={isBlocked}
                >
                  <div className="flex items-center space-x-3 text-left w-full">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <div className="flex-grow">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </div>
                    </div>
                    {isBlocked && <Lock className="h-4 w-4 text-gray-500" />}
                  </div>
                </Button>
              );

              if (isBlocked) {
                return (
                  <Tooltip key={action.title}>
                    <TooltipTrigger asChild>
                      <div>{buttonItself}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {blockReason === 'EXPIRED'
                          ? 'Seu plano expirou. Renove para ter acesso.'
                          : 'Assine um plano para liberar esta ação.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div key={action.title}>
                  {buttonItself}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
