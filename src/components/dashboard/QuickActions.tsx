
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  UserPlus, 
  Camera, 
  FileText,
  Stethoscope,
  MessageCircle,
  Sparkles,
  BarChart3
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 justify-start hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={action.onClick}
              >
                <div className="flex items-center space-x-3 text-left">
                  <Icon className={`h-5 w-5 ${action.color}`} />
                  <div>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
