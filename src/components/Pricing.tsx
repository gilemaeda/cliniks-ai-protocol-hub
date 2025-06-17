
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Bronze",
      price: "Gratuito",
      period: "",
      description: "Ideal para testar a plataforma",
      features: [
        "5 avaliações por mês",
        "1 profissional",
        "Protocolos básicos de IA",
        "Suporte por email"
      ],
      popular: false,
      cta: "Começar Grátis"
    },
    {
      name: "Prata",
      price: "R$ 69,90",
      period: "/mês",
      description: "Perfeito para clínicas pequenas",
      features: [
        "50 avaliações por mês",
        "Até 3 profissionais",
        "Galeria de fotos",
        "Protocolos avançados de IA",
        "Relatórios em PDF",
        "Suporte prioritário"
      ],
      popular: true,
      cta: "Escolher Prata"
    },
    {
      name: "Ouro",
      price: "R$ 149,90",
      period: "/mês",
      description: "Ideal para clínicas maiores",
      features: [
        "Avaliações ilimitadas",
        "Profissionais ilimitados",
        "Galeria avançada",
        "IA personalizada",
        "API integrations",
        "WhatsApp integrado",
        "Suporte 24/7",
        "Treinamento incluído"
      ],
      popular: false,
      cta: "Escolher Ouro"
    }
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Planos e Preços
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Escolha o plano ideal para sua clínica
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Planos flexíveis com desconto para pagamento anual
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-glow scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-cliniks text-white px-4 py-1">
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-gradient-cliniks hover:opacity-90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            💳 Pagamento anual com <strong>20% de desconto</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Todos os planos incluem 7 dias de teste grátis • Cancele a qualquer momento
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
