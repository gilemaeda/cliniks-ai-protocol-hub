import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Stethoscope, Users } from 'lucide-react';

const NovaAvaliacao = () => {
  const navigate = useNavigate();

  const handleStartAssessment = (type: 'facial' | 'corporal' | 'capilar') => {
    navigate(`/avaliacao-ia/${type}`);
  };

  const assessmentTypes = [
    {
      type: 'facial' as const,
      title: 'Avaliação Facial',
      description: 'Análise facial com foco em pele, rugas e flacidez',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      type: 'corporal' as const,
      title: 'Avaliação Corporal',
      description: 'Análise corporal com foco em contorno, gordura localizada e flacidez',
      icon: Stethoscope,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      type: 'capilar' as const,
      title: 'Avaliação Capilar',
      description: 'Análise do couro cabeludo e fios com protocolos para queda e crescimento',
      icon: Brain,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Escolha o Tipo de Avaliação
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Selecione o tipo de avaliação que deseja realizar com a inteligência artificial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assessmentTypes.map((assessment) => {
          const Icon = assessment.icon;
          return (
            <Card key={assessment.type} className="transition-all hover:shadow-lg">
              <Button
                variant="ghost"
                className="h-full w-full p-0"
                onClick={() => handleStartAssessment(assessment.type)}
              >
                <CardContent className="text-center p-6">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                      <Icon className={`h-8 w-8 ${assessment.color}`} />
                    </div>
                    <CardTitle className="text-xl mb-2">{assessment.title}</CardTitle>
                  </CardHeader>
                  <p className="text-gray-600 dark:text-gray-400">
                    {assessment.description}
                  </p>
                </CardContent>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NovaAvaliacao;
