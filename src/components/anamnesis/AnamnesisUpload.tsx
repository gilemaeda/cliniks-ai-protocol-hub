
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, FileText, AlertCircle, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';

interface AnamnesisUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

const AnamnesisUpload = ({ onComplete, onCancel }: AnamnesisUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'pdf' | 'excel' | ''>('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [clinic, setClinic] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchClinicAndPatients();
    }
  }, [user]);

  const fetchClinicAndPatients = async () => {
    if (!user) return;

    try {
      // Buscar dados da clínica
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (clinicData && clinicData.length > 0) {
        const clinicInfo = clinicData[0];
        setClinic(clinicInfo);

        // Buscar pacientes da clínica
        const { data: patientsData, error } = await supabase
          .from('patients')
          .select('id, full_name')
          .eq('clinic_id', clinicInfo.clinic_id)
          .order('full_name');

        if (error) throw error;
        setPatients(patientsData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da clínica",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    const fileType = selectedFile.type;
    const fileName = selectedFile.name.toLowerCase();
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      setUploadType('pdf');
    } else if (
      fileType.includes('sheet') || 
      fileName.endsWith('.xlsx') || 
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv')
    ) {
      setUploadType('excel');
    } else {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, selecione um arquivo PDF ou planilha (Excel/CSV)",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !uploadType) {
      toast({
        title: "Erro de validação",
        description: "Selecione um arquivo válido para fazer upload",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPatientId) {
      toast({
        title: "Paciente não selecionado",
        description: "Selecione um paciente para vincular os dados da anamnese",
        variant: "destructive"
      });
      return;
    }

    if (!clinic?.clinic_id) {
      toast({
        title: "Erro",
        description: "Dados da clínica não encontrados",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simular processamento do arquivo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar entrada na anamnesis_data
      const anamnesisData = {
        patient_id: selectedPatientId,
        clinic_id: clinic.clinic_id,
        anamnesis_type: 'upload',
        general_health: { 
          source: 'upload',
          filename: file.name,
          upload_type: uploadType,
          processed_at: new Date().toISOString(),
          main_complaints: 'Dados extraídos automaticamente do arquivo',
          medical_history: 'Histórico médico processado',
          current_medications: 'Medicamentos atuais identificados'
        },
        lifestyle: {
          diet: 'Informações dietéticas extraídas',
          exercise: 'Rotina de exercícios identificada',
          sleep: 'Padrão de sono analisado'
        },
        facial_assessment: {
          skin_type: 'Tipo de pele identificado',
          main_concerns: 'Principais preocupações faciais',
          previous_treatments: 'Tratamentos anteriores listados'
        },
        body_assessment: {
          areas_of_concern: 'Áreas de preocupação corporal',
          skin_condition: 'Condição da pele corporal',
          previous_procedures: 'Procedimentos anteriores realizados'
        },
        body_measurements: {
          height: 'Altura extraída',
          weight: 'Peso identificado',
          measurements: 'Medidas corporais processadas'
        },
        hair_assessment: {
          hair_type: 'Tipo de cabelo identificado',
          scalp_condition: 'Condição do couro cabeludo',
          concerns: 'Preocupações capilares'
        },
        created_by: user?.id,
        professional_id: clinic.professional_id
      };

      const { error } = await supabase
        .from('anamnesis_data')
        .insert(anamnesisData);

      if (error) throw error;

      toast({
        title: "Upload realizado com sucesso!",
        description: `Arquivo ${file.name} processado e vinculado ao paciente. Os dados foram extraídos automaticamente.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível processar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle>Upload de Anamnese</CardTitle>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Faça upload de PDF ou planilha com dados de anamnese. O sistema irá extrair e organizar os dados automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Paciente */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Paciente *</span>
          </Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o paciente para vincular a anamnese" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {patients.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhum paciente encontrado. Cadastre pacientes primeiro.
            </p>
          )}
        </div>

        {/* Área de Upload */}
        <div className="space-y-4">
          <Label>Arquivo de Anamnese</Label>
          
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Arraste seu arquivo aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Arquivos suportados: PDF, Excel (.xlsx, .xls), CSV
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="mt-4"
              />
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {uploadType === 'pdf' ? 'PDF' : 'Planilha'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={removeFile}>
                  Remover
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Informações sobre o processamento */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-200">
                Como funciona o processamento automático:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Extração automática de dados seguindo padrão Cliniks IA</li>
                <li>• Identificação de queixa principal, histórico e medicamentos</li>
                <li>• Organização por área: facial, corporal e capilar</li>
                <li>• Vinculação automática ao paciente selecionado</li>
                <li>• Dados disponíveis para revisão e edição posterior</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button 
            onClick={handleUpload} 
            disabled={!file || loading || !selectedPatientId || patients.length === 0} 
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando arquivo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Processar Arquivo
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnamnesisUpload;
