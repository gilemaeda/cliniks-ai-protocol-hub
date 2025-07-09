import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { PlanStatus } from '@/types/clinic';

interface PlanStatusBannerProps {
  status: PlanStatus;
  daysRemaining: number | null;
}

const PlanStatusBanner: React.FC<PlanStatusBannerProps> = ({ status, daysRemaining }) => {
  const navigate = useNavigate();

  const bannerConfig = {
    TRIAL: {
      icon: Zap,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      title: 'Você está no período de testes!',
      message: `Você tem ${daysRemaining} dias restantes com todas as ferramentas liberadas para uso.`,
      buttonText: 'Ver Planos',
    },
    ACTIVE: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      title: 'Seu plano está ativo!',
      message: 'Agradecemos por fazer parte da nossa comunidade.',
      buttonText: 'Gerenciar Assinatura',
    },
    EXPIRED: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      title: 'Seu período de teste ou plano expirou!',
      message: 'Para continuar usando os recursos, por favor, escolha um plano.',
      buttonText: 'Fazer Upgrade Agora',
    },
    INACTIVE: {
      icon: Info,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      title: 'Nenhum plano ativo.',
      message: 'Assine um de nossos planos para ter acesso completo à plataforma.',
      buttonText: 'Ver Planos',
    },
    LOADING: {
        icon: Info,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        title: 'Carregando status do plano...',
        message: 'Aguarde um momento.',
        buttonText: '',
      },
  };

  if (status === 'LOADING' || !bannerConfig[status]) {
    return null; // Ou um spinner de carregamento
  }

  const config = bannerConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`mb-6 p-4 border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-center">
        <Icon className={`h-8 w-8 mr-4 ${config.textColor}`} />
        <div className="flex-grow">
          <h3 className={`font-bold text-lg ${config.textColor}`}>{config.title}</h3>
          <p className={`text-sm ${config.textColor}`}>{config.message}</p>
        </div>
        {config.buttonText && (
          <Button onClick={() => navigate('/assinaturas')} size="sm">
            {config.buttonText}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PlanStatusBanner;
