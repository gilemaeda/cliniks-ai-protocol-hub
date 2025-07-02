import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, FileText, Target, Download, Mail, Share2 } from 'lucide-react';
import { Assessment } from '../types/assessment';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateAssessmentPDF } from '../PDFGenerator';
import { useToast } from '@/hooks/use-toast';

interface AssessmentDetailsDialogProps {
  assessment: Assessment;
  isOpen: boolean;
  onClose: () => void;
}

const AssessmentDetailsDialog = ({ assessment, isOpen, onClose }: AssessmentDetailsDialogProps) => {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    pdf: false,
    email: false,
    whatsapp: false
  });
  const { toast } = useToast();

  const getAssessmentTypeLabel = (type: string) => {
    switch (type) {
      case 'facial':
        return 'Facial';
      case 'corporal':
        return 'Corporal';
      case 'capilar':
        return 'Capilar';
      default:
        return type;
    }
  };

  const getAssessmentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'facial':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      case 'corporal':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'capilar':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsLoading(prev => ({ ...prev, pdf: true }));
      
      // Preparar dados da avaliação para o PDF
      const assessmentData = {
        id: assessment.id,
        patient_name: assessment.patient_name,
        patient_age: assessment.patient_age,
        assessment_type: getAssessmentTypeLabel(assessment.assessment_type),
        treatment_objective: assessment.treatment_objective,
        main_complaint: assessment.main_complaint,
        observations: assessment.observations,
        ai_protocol: assessment.ai_protocol,
        created_at: assessment.created_at,
        professional: assessment.professionals ? {
          profiles: assessment.professionals.profiles
        } : null
      };

      // Gerar o PDF
      const pdf = await generateAssessmentPDF(assessmentData);
      
      // Salvar o PDF
      pdf.save(`avaliacao-${assessment.patient_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  const handleSendEmail = async () => {
    try {
      // Mostrar toast imediatamente para feedback visual
      toast({
        title: "Gerando PDF",
        description: "Preparando arquivo para envio...",
      });
      
      setIsLoading(prev => ({ ...prev, email: true }));
      
      // Preparar dados da avaliação para o PDF
      const assessmentData = {
        id: assessment.id,
        patient_name: assessment.patient_name,
        patient_age: assessment.patient_age,
        assessment_type: getAssessmentTypeLabel(assessment.assessment_type),
        treatment_objective: assessment.treatment_objective,
        main_complaint: assessment.main_complaint,
        observations: assessment.observations,
        ai_protocol: assessment.ai_protocol,
        created_at: assessment.created_at,
        professional: assessment.professionals ? {
          profiles: assessment.professionals.profiles
        } : null
      };

      // Gerar o PDF
      const pdf = await generateAssessmentPDF(assessmentData);
      
      // Nome do arquivo formatado
      const fileName = `avaliacao-${assessment.patient_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Salvar o PDF
      pdf.save(fileName);
      
      // Obter o email do profissional, se disponível
      const recipientEmail = assessment.professionals?.profiles?.email || '';
      const emailInfo = recipientEmail ? ` para ${recipientEmail}` : '';
      
      toast({
        title: "PDF Gerado com Sucesso",
        description: `O arquivo "${fileName}" foi salvo no seu computador. Abra seu cliente de email e anexe este arquivo para enviá-lo${emailInfo}.`,
        duration: 8000, // Mostrar por mais tempo para o usuário ler
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleShareWhatsApp = () => {
    try {
      setIsLoading(prev => ({ ...prev, whatsapp: true }));
      
      // Criar texto para compartilhar
      const messageText = `*Avaliação Estética - ${getAssessmentTypeLabel(assessment.assessment_type)}*\n\n` +
        `Paciente: ${assessment.patient_name}\n` +
        `Queixa Principal: ${assessment.main_complaint}\n` +
        `Objetivo: ${assessment.treatment_objective}\n\n` +
        `Avaliação realizada em: ${new Date(assessment.created_at).toLocaleDateString('pt-BR')}`;
      
      // Codificar o texto para URL
      const encodedMessage = encodeURIComponent(messageText);
      
      // Abrir WhatsApp Web com a mensagem
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      setIsLoading(prev => ({ ...prev, whatsapp: false }));
    } catch (error) {
      console.error('Erro ao compartilhar via WhatsApp:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao compartilhar via WhatsApp. Tente novamente.",
        variant: "destructive"
      });
      setIsLoading(prev => ({ ...prev, whatsapp: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Detalhes da Avaliação</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Paciente */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Informações do Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                <p className="text-gray-900 dark:text-white">{assessment.patient_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Idade</label>
                <p className="text-gray-900 dark:text-white">{assessment.patient_age} anos</p>
              </div>
            </div>
          </div>

          {/* Informações da Avaliação */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Detalhes da Avaliação
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Avaliação</label>
                <div className="mt-1">
                  <Badge className={getAssessmentTypeBadgeColor(assessment.assessment_type)}>
                    {getAssessmentTypeLabel(assessment.assessment_type)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Queixa Principal</label>
                <p className="text-gray-900 dark:text-white mt-1">{assessment.main_complaint}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Objetivo do Tratamento</label>
                <p className="text-gray-900 dark:text-white mt-1">{assessment.treatment_objective}</p>
              </div>
              
              {assessment.observations && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</label>
                  <p className="text-gray-900 dark:text-white mt-1">{assessment.observations}</p>
                </div>
              )}
            </div>
          </div>

          {/* Protocolo da IA */}
          {assessment.ai_protocol && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Protocolo Gerado pela IA</h3>
              <div className="bg-white dark:bg-gray-900 rounded border p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {assessment.ai_protocol}
                </pre>
              </div>
            </div>
          )}

          {/* Informações do Profissional */}
          {assessment.professionals && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Profissional Responsável</h3>
              <div>
                {assessment.professionals.profiles ? (
                  <>
                    <p className="text-gray-900 dark:text-white">{assessment.professionals.profiles.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{assessment.professionals.profiles.email}</p>
                  </>
                ) : (
                  <p className="text-gray-900 dark:text-white">Profissional da clínica</p>
                )}
              </div>
            </div>
          )}

          {/* Data de Criação */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Data da Avaliação
            </h3>
            <p className="text-gray-900 dark:text-white">
              {new Date(assessment.created_at).toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={isLoading.pdf}
            >
              {isLoading.pdf ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendEmail}
              disabled={isLoading.email}
            >
              {isLoading.email ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Enviar por Email
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShareWhatsApp}
              disabled={isLoading.whatsapp}
            >
              {isLoading.whatsapp ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Compartilhar WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentDetailsDialog;
