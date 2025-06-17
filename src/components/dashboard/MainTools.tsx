
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles, Package, Users, Settings, Camera, User, Brain, FileText, MessageCircle, History } from 'lucide-react';

const MainTools = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'avaliacao-facial',
      title: 'Avaliação Facial',
      description: 'Análise completa da pele facial com IA',
      icon: User,
      color: 'bg-blue-500',
      badge: 'IA',
      badgeColor: 'bg-blue-500',
      onClick: () => navigate('/avaliacao-ia?type=facial')
    },
    {
      id: 'avaliacao-corporal',
      title: 'Avaliação Corporal',
      description: 'Avaliação corporal inteligente e personalizada',
      icon: Brain,
      color: 'bg-green-500',
      badge: 'IA',
      badgeColor: 'bg-green-500',
      onClick: () => navigate('/avaliacao-ia?type=corporal')
    },
    {
      id: 'avaliacao-capilar',
      title: 'Avaliação Capilar',
      description: 'Análise tricológica com inteligência artificial',
      icon: Sparkles,
      color: 'bg-purple-500',
      badge: 'IA',
      badgeColor: 'bg-purple-500',
      onClick: () => navigate('/avaliacao-ia?type=capilar')
    },
    {
      id: 'chat-ia',
      title: 'Chat IA Especializada',
      description: 'Converse com a IA para tirar dúvidas sobre estética',
      icon: MessageCircle,
      color: 'bg-pink-500',
      badge: 'IA',
      badgeColor: 'bg-pink-500',
      onClick: () => navigate('/chat-ia')
    },
    {
      id: 'historico-avaliacoes',
      title: 'Histórico de Avaliações',
      description: 'Visualize e gerencie todas as avaliações realizadas',
      icon: History,
      color: 'bg-indigo-500',
      badge: 'Essencial',
      badgeColor: 'bg-blue-500',
      onClick: () => navigate('/avaliacao-ia?tab=historico')
    },
    {
      id: 'protocolos',
      title: 'Protocolos Personalizados',
      description: 'Crie protocolos únicos com IA especializada',
      icon: Clock,
      color: 'bg-orange-500',
      badge: 'Premium',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
      onClick: () => navigate('/protocolos-personalizados')
    },
    {
      id: 'recursos',
      title: 'Central de Recursos',
      description: 'Gerencie equipamentos, produtos cosméticos e injetáveis',
      icon: Package,
      color: 'bg-teal-500',
      badge: 'Essencial',
      badgeColor: 'bg-blue-500',
      onClick: () => navigate('/central-recursos')
    },
    {
      id: 'pacientes',
      title: 'Pacientes',
      description: 'Gerencie o cadastro e informações dos seus pacientes',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/patients')
    },
    {
      id: 'anamneses',
      title: 'Anamneses',
      description: 'Formulários específicos para cada tipo de avaliação',
      icon: FileText,
      color: 'bg-green-500',
      badge: 'Essencial',
      badgeColor: 'bg-orange-500',
      onClick: () => navigate('/anamneses')
    },
    {
      id: 'galeria',
      title: 'Galeria de Fotos',
      description: 'Organize e compare fotos de evolução dos tratamentos',
      icon: Camera,
      color: 'bg-orange-500',
      badge: 'Novo',
      badgeColor: 'bg-purple-500',
      onClick: () => navigate('/galeria-fotos')
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">Ferramentas Principais</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Acesse as principais funcionalidades da plataforma
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Card key={tool.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6" onClick={tool.onClick}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${tool.color} group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    {tool.badge && (
                      <Badge className={`text-white text-xs ${tool.badgeColor}`}>
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{tool.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {tool.description}
                  </p>
                  <Button className="w-full" variant="outline" size="sm">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MainTools;
