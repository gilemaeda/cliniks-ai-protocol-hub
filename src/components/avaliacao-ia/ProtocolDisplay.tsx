
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Mail, MessageCircle, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAssessmentPDF } from './PDFGenerator';

interface ProtocolDisplayProps {
  protocol: string;
  patientData: {
    patientName: string;
    patientAge: string;
    treatmentObjective: string;
    mainComplaint: string;
    observations: string;
  };
  assessmentType: string;
  onBack: () => void;
  onNewAssessment: () => void;
}

const ProtocolDisplay = ({ 
  protocol, 
  patientData, 
  assessmentType, 
  onBack, 
  onNewAssessment 
}: ProtocolDisplayProps) => {
  const { toast } = useToast();

  const getTypeTitle = () => {
    switch (assessmentType) {
      case 'facial': return 'Facial';
      case 'corporal': return 'Corporal';
      case 'capilar': return 'Capilar';
      default: return assessmentType;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const assessmentData = {
        id: crypto.randomUUID(),
        patient_name: patientData.patientName,
        patient_age: parseInt(patientData.patientAge),
        assessment_type: getTypeTitle(),
        treatment_objective: patientData.treatmentObjective,
        main_complaint: patientData.mainComplaint,
        observations: patientData.observations || '',
        ai_protocol: protocol,
        created_at: new Date().toISOString(),
        professional: {
          profiles: {
            full_name: 'Profissional'
          }
        }
      };

      const pdf = await generateAssessmentPDF(assessmentData);
      const fileName = `Avaliacao_${getTypeTitle()}_${patientData.patientName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      
      pdf.save(fileName);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado para seu dispositivo"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o arquivo PDF",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Avaliação ${getTypeTitle()} - ${patientData.patientName}`);
    const body = encodeURIComponent(`
Protocolo de Tratamento - ${getTypeTitle()}

Paciente: ${patientData.patientName}
Idade: ${patientData.patientAge} anos
Objetivo: ${patientData.treatmentObjective}
Queixa: ${patientData.mainComplaint}

Protocolo:
${protocol}

---
Enviado via Cliniks IA Portal
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(`
*Protocolo de Tratamento ${getTypeTitle()}*

👤 *Paciente:* ${patientData.patientName}
📅 *Idade:* ${patientData.patientAge} anos
🎯 *Objetivo:* ${patientData.treatmentObjective}
💭 *Queixa:* ${patientData.mainComplaint}

📋 *Protocolo IA:*
${protocol}

_Enviado via Cliniks IA Portal_
    `);
    
    window.open(`https://wa.me/?text=${message}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Protocolo Gerado - {getTypeTitle()}
          </h3>
        </div>
        <Button onClick={onNewAssessment}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Protocolo de Tratamento IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {protocol}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</p>
                <p className="text-sm">{patientData.patientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Idade</p>
                <p className="text-sm">{patientData.patientAge} anos</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</p>
                <p className="text-sm">{getTypeTitle()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Objetivo</p>
                <p className="text-sm">{patientData.treatmentObjective}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Queixa</p>
                <p className="text-sm">{patientData.mainComplaint}</p>
              </div>
              {patientData.observations && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</p>
                  <p className="text-sm">{patientData.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSendEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSendWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProtocolDisplay;
