
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  FileText, 
  Brain, 
  Package, 
  ArrowRight, 
  CheckCircle,
  Star
} from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action?: string;
}

const WelcomeTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps: TutorialStep[] = [
    {
      id: 1,
      title: "Bem-vindo ao Cliniks IA!",
      description: "Vamos configurar sua clínica em alguns passos simples. O Cliniks IA é sua plataforma completa para gestão de estética clínica com inteligência artificial.",
      icon: Star,
      color: "bg-gradient-to-r from-purple-500 to-pink-500"
    },
    {
      id: 2,
      title: "1. Cadastre seus Pacientes",
      description: "Primeira ação na plataforma: adicione os pacientes da sua clínica. Isso permitirá vincular anamneses, avaliações e protocolos aos pacientes corretos.",
      icon: Users,
      color: "bg-blue-500",
      action: "Ir para Pacientes"
    },
    {
      id: 3,
      title: "2. Configure Equipamentos e Produtos",
      description: "Cadastre seus equipamentos e produtos cosméticos/injetáveis. A IA usará essas informações para gerar protocolos personalizados mais precisos.",
      icon: Package,
      color: "bg-teal-500",
      action: "Ir para Central de Recursos"
    },
    {
      id: 4,
      title: "3. Crie Anamneses Detalhadas",
      description: "Com os pacientes cadastrados, você pode criar anamneses específicas (facial, corporal, capilar) vinculadas a cada paciente.",
      icon: FileText,
      color: "bg-green-500",
      action: "Ir para Anamneses"
    },
    {
      id: 5,
      title: "4. Utilize as Avaliações IA",
      description: "Agora você pode usar as ferramentas de avaliação com IA, utilizando os dados dos pacientes e recursos cadastrados para gerar protocolos inteligentes.",
      icon: Brain,
      color: "bg-purple-500",
      action: "Explorar Avaliações IA"
    }
  ];

  useEffect(() => {
    // Verificar se deve mostrar o tutorial
    const hasSeenTutorial = localStorage.getItem('cliniks-tutorial-seen');
    const dontShow = localStorage.getItem('cliniks-tutorial-dont-show');
    
    if (!hasSeenTutorial && !dontShow) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('cliniks-tutorial-seen', 'true');
    if (dontShowAgain) {
      localStorage.setItem('cliniks-tutorial-dont-show', 'true');
    }
    setIsOpen(false);
  };

  const handleActionClick = (step: TutorialStep) => {
    handleClose();
    
    // Navegar para a página correspondente
    switch (step.id) {
      case 2:
        window.location.href = '/patients';
        break;
      case 3:
        window.location.href = '/central-recursos';
        break;
      case 4:
        window.location.href = '/anamneses';
        break;
      case 5:
        window.location.href = '/avaliacao-ia';
        break;
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Configuração Inicial
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Passo {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full ${currentStepData.color} mx-auto mb-4 flex items-center justify-center`}>
                <IconComponent className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold mb-3">
                {currentStepData.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {currentStepData.description}
              </p>

              {currentStepData.action && (
                <Button 
                  onClick={() => handleActionClick(currentStepData)}
                  className="w-full mb-3"
                >
                  {currentStepData.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Don't show again option */}
          {currentStep === steps.length - 1 && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label htmlFor="dont-show" className="text-sm text-gray-600 dark:text-gray-400">
                Não mostrar este tutorial novamente
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={handleClose}>
                Pular
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                {currentStep !== steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
                {currentStep === steps.length - 1 && <CheckCircle className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeTutorial;
