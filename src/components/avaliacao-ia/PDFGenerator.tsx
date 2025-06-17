
import jsPDF from 'jspdf';

interface Assessment {
  id: string;
  patient_name: string;
  patient_age: number;
  assessment_type: string;
  treatment_objective: string;
  main_complaint: string;
  observations?: string;
  ai_protocol?: string;
  created_at: string;
  professional: {
    profiles: {
      full_name: string;
    } | null;
  } | null;
}

export const generateAssessmentPDF = async (assessment: Assessment, clinicLogo?: string) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = 40;

  // Header com logos - aumentado significativamente
  // Logo Cliniks IA (esquerda) - muito maior
  try {
    const clinikImage = await fetch('/lovable-uploads/ed86d62a-a928-44f7-8e5f-ec4200aedbb3.png');
    const clinikBlob = await clinikImage.blob();
    const clinikBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(clinikBlob);
    });
    
    // Logo da Cliniks IA muito maior (80x30)
    pdf.addImage(clinikBase64, 'PNG', margin, 10, 80, 30);
  } catch (error) {
    // Fallback para texto se não conseguir carregar a imagem
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cliniks IA', margin, 25);
  }
  
  // Logo da clínica (direita) - também maior
  if (clinicLogo) {
    try {
      pdf.addImage(clinicLogo, 'PNG', pageWidth - margin - 60, 10, 60, 30);
    } catch (error) {
      console.log('Erro ao carregar logo da clínica:', error);
    }
  }
  
  yPosition += 10;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Avaliação Estética Clínica', margin, yPosition);
  
  // Linha separadora
  yPosition += 10;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Informações do paciente
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DO PACIENTE', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const patientInfo = [
    `Nome: ${assessment.patient_name}`,
    `Idade: ${assessment.patient_age} anos`,
    `Tipo de Avaliação: ${assessment.assessment_type}`,
    `Data: ${new Date(assessment.created_at).toLocaleDateString('pt-BR')}`,
    `Profissional: ${assessment.professional?.profiles?.full_name || 'Não informado'}`
  ];

  patientInfo.forEach(info => {
    pdf.text(info, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 10;

  // Avaliação
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AVALIAÇÃO', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // Objetivo do Tratamento
  pdf.setFont('helvetica', 'bold');
  pdf.text('Objetivo do Tratamento:', margin, yPosition);
  yPosition += lineHeight;
  pdf.setFont('helvetica', 'normal');
  
  const objectiveLines = pdf.splitTextToSize(assessment.treatment_objective, pageWidth - 2 * margin);
  pdf.text(objectiveLines, margin, yPosition);
  yPosition += objectiveLines.length * lineHeight + 5;

  // Queixa Principal
  pdf.setFont('helvetica', 'bold');
  pdf.text('Queixa Principal:', margin, yPosition);
  yPosition += lineHeight;
  pdf.setFont('helvetica', 'normal');
  
  const complaintLines = pdf.splitTextToSize(assessment.main_complaint, pageWidth - 2 * margin);
  pdf.text(complaintLines, margin, yPosition);
  yPosition += complaintLines.length * lineHeight + 5;

  // Observações (se houver)
  if (assessment.observations) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Observações:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    
    const obsLines = pdf.splitTextToSize(assessment.observations, pageWidth - 2 * margin);
    pdf.text(obsLines, margin, yPosition);
    yPosition += obsLines.length * lineHeight + 10;
  }

  // Protocolo IA - Limpar hashtags e formatação markdown
  if (assessment.ai_protocol) {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROTOCOLO GERADO PELA IA', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Remover hashtags e limpar formatação markdown
    const cleanProtocol = assessment.ai_protocol
      .replace(/#{1,6}\s/g, '') // Remove hashtags
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove asteriscos mas mantém o texto
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // Remove underlines mas mantém o texto
      .replace(/`{1,3}([^`]+)`{1,3}/g, '$1') // Remove backticks mas mantém o texto
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links markdown mas mantém o texto
      .replace(/^\s*[-*+]\s+/gm, '• ') // Converte listas markdown em bullets
      .replace(/^\s*\d+\.\s+/gm, '• '); // Converte listas numeradas em bullets
    
    const protocolLines = pdf.splitTextToSize(cleanProtocol, pageWidth - 2 * margin);
    
    protocolLines.forEach(line => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });
  }

  // Footer
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Gerado por Cliniks IA Portal', margin, pageHeight - 15);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 30, pageHeight - 15);
  }

  return pdf;
};
