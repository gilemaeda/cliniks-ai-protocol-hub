
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Image, Calendar } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <User className="h-8 w-8" />,
      title: "Avaliação IA Inteligente",
      description: "Gere protocolos de tratamento personalizados com inteligência artificial para procedimentos faciais, corporais e capilares.",
      badge: "IA Avançada"
    },
    {
      icon: <Image className="h-8 w-8" />,
      title: "Galeria Antes & Depois",
      description: "Documente a evolução dos tratamentos com galeria de fotos segura e comparações visuais profissionais.",
      badge: "Visual"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Gestão Completa",
      description: "Gerencie profissionais, equipamentos e configurações da clínica em uma plataforma centralizada.",
      badge: "Gestão"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Histórico Detalhado",
      description: "Mantenha registro completo de todas as avaliações com opções de export em PDF e compartilhamento.",
      badge: "Relatórios"
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Funcionalidades
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que sua clínica precisa
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais desenvolvidas especificamente para o setor de estética clínica
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-lg transition-all duration-300 hover:shadow-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
