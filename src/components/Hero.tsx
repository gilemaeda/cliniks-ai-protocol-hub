
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Hero = () => {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7f00fa]/5 to-[#fb0082]/5" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-[#7f00fa]/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#fb0082]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 bg-[#7f00fa]/10 text-[#7f00fa] hover:bg-[#7f00fa]/20">
            🚀 Inteligência Artificial para Estética Clínica
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Transforme sua
            <span className="gradient-text block">
              Clínica Estética
            </span>
            com Inteligência Artificial
          </h1>
          
          <p className="text-xl text-[#424242]/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          O Cliniks IA é um portal completo que oferece ferramentas de inteligência artificial para avaliações inteligentes, criação de protocolos personalizados e suporte integral aos profissionais de estética em sua rotina clínica.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-cliniks hover:opacity-90 shadow-glow">
              Começar Gratuitamente
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-[#7f00fa] text-[#7f00fa] hover:bg-[#7f00fa]/10">
              Ver Demonstração
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="glass-effect border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold gradient-text mb-2">500+</div>
                <div className="text-sm text-[#424242]/70">Clínicas Ativas</div>
              </CardContent>
            </Card>
            <Card className="glass-effect border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold gradient-text mb-2">10k+</div>
                <div className="text-sm text-[#424242]/70">Avaliações Geradas</div>
              </CardContent>
            </Card>
            <Card className="glass-effect border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold gradient-text mb-2">98%</div>
                <div className="text-sm text-[#424242]/70">Satisfação</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
