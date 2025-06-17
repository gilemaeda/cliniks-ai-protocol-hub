import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientAnamnesisData } from '@/types/anamnesis';
import { FileText, User, Calendar, Heart, Activity, Smile, Users, Ruler, Scissors } from 'lucide-react';

interface AnamnesisDisplayProps {
  anamnesis: PatientAnamnesisData;
}

const AnamnesisDisplay = ({ anamnesis }: AnamnesisDisplayProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFieldName = (key: string) => {
    const fieldNames: Record<string, string> = {
      'source': 'Origem dos Dados',
      'filename': 'Nome do Arquivo',
      'upload_type': 'Tipo de Upload',
      'processed_at': 'Processado em',
      'main_complaints': 'Queixas Principais',
      'medical_history': 'Histórico Médico',
      'current_medications': 'Medicamentos Atuais',
      'diet': 'Alimentação',
      'exercise': 'Exercícios',
      'sleep': 'Sono',
      'skin_type': 'Tipo de Pele',
      'main_concerns': 'Principais Preocupações',
      'previous_treatments': 'Tratamentos Anteriores',
      'body_biotype': 'Biotipo Corporal',
      'body_fibrosis': 'Fibroses',
      'body_cellulite': 'Celulite',
      'body_flaccidity': 'Flacidez',
      'body_areas_bother': 'Áreas que Incomodam',
      'body_observations': 'Observações',
      'body_localized_fat': 'Gordura Localizada',
      'body_stretch_marks': 'Estrias',
      'body_varicose_veins': 'Varizes/Vasinhos',
      'body_cellulite_grade': 'Grau da Celulite',
      'body_complaint_areas': 'Áreas de Queixa',
      'body_fluid_retention': 'Retenção de Líquido',
      'body_flaccidity_grade': 'Grau da Flacidez',
      'imc': 'IMC',
      'height_cm': 'Altura (cm)',
      'weight_kg': 'Peso (kg)',
      'circumference_abdomen': 'Circunferência Abdômen',
      'circumference_waist': 'Circunferência Cintura',
      'circumference_hip': 'Circunferência Quadril',
      'circumference_thigh_right': 'Coxa Direita',
      'circumference_thigh_left': 'Coxa Esquerda',
      'circumference_arm_right': 'Braço Direito',
      'circumference_arm_left': 'Braço Esquerdo',
      'hair_type': 'Tipo de Cabelo',
      'scalp_condition': 'Condição do Couro Cabeludo',
      'concerns': 'Preocupações',
      'has_allergy': 'Possui Alergia?',
      'allergy_details': 'Detalhes da Alergia',
      'continuous_medication': 'Uso de Medicamentos Contínuos?',
      'continuous_medication_details': 'Quais Medicamentos?',
      'pre_existing_conditions': 'Possui Doenças Pré-existentes?',
      'pre_existing_conditions_details': 'Quais Doenças?',
      'previous_aesthetic_procedures': 'Já fez Procedimentos Estéticos?',
      'previous_aesthetic_procedures_details': 'Quais Procedimentos?',
      'pregnant_or_lactating': 'Gestante ou Amamentando?',
      'autoimmune_disease': 'Doença Autoimune?',
      'keloid_history': 'Histórico de Queloide?',
      'surgeries': 'Já fez Cirurgias?',
      'surgery_details': 'Quais Cirurgias?',
      'circulatory_problem': 'Problema Circulatório?',
      'hormonal_problem': 'Problema Hormonal?',
      'fluid_retention_history': 'Retenção de Líquido?',
      'intestinal_constipation': 'Constipação Intestinal?',
    };
    
    return fieldNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderInfoCard = (title: string, icon: React.ReactNode, data: Record<string, any>) => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return (
                <div key={key} className="space-y-2">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    {formatFieldName(key)}
                  </h4>
                  <div className="ml-4 space-y-1">
                    {Object.entries(value).map(([subKey, subValue]) => (
                      <div key={subKey} className="flex justify-between items-start">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {formatFieldName(subKey)}:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2 flex-1 text-right">
                          {String(subValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={key} className="flex justify-between items-start">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {formatFieldName(key)}:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2 flex-1 text-right">
                    {String(value)}
                  </span>
                </div>
              );
            }
          })}
        </CardContent>
      </Card>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'corporal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'capilar':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'upload':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTypeName = (type: string) => {
    switch (type) {
      case 'facial':
        return 'Avaliação Facial';
      case 'corporal':
        return 'Avaliação Corporal';
      case 'capilar':
        return 'Avaliação Capilar';
      case 'upload':
        return 'Upload de Arquivo';
      default:
        return 'Avaliação Geral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com informações do paciente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {anamnesis.patient?.full_name || 'Paciente Desconhecido'}
                </h2>
              </div>
              <Badge className={getTypeColor(anamnesis.anamnesis_type)}>
                {formatTypeName(anamnesis.anamnesis_type)}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(anamnesis.created_at)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de informações organizadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderInfoCard(
          'Histórico de Saúde Geral',
          <Heart className="h-5 w-5 text-red-500" />,
          anamnesis.general_health
        )}

        {renderInfoCard(
          'Estilo de Vida',
          <Activity className="h-5 w-5 text-green-500" />,
          anamnesis.lifestyle
        )}

        {renderInfoCard(
          'Avaliação Facial',
          <Smile className="h-5 w-5 text-blue-500" />,
          anamnesis.facial_assessment
        )}

        {renderInfoCard(
          'Avaliação Corporal',
          <Users className="h-5 w-5 text-purple-500" />,
          anamnesis.body_assessment
        )}

        {renderInfoCard(
          'Medidas Corporais',
          <Ruler className="h-5 w-5 text-orange-500" />,
          anamnesis.body_measurements
        )}

        {renderInfoCard(
          'Avaliação Capilar',
          <Scissors className="h-5 w-5 text-pink-500" />,
          anamnesis.hair_assessment
        )}
      </div>

      {/* Dados adicionais (se existirem) */}
      {anamnesis.data && Object.keys(anamnesis.data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span>Dados Técnicos do Processamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                {JSON.stringify(anamnesis.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnamnesisDisplay;
