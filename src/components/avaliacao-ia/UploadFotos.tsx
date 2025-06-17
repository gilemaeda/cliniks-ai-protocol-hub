
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  full_name: string;
}

interface UploadFotosProps {
  onUploadSuccess?: () => void;
  onClose?: () => void;
}

const UploadFotos = ({ onUploadSuccess, onClose }: UploadFotosProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileList | null>(null);
  const [photoType, setPhotoType] = useState('');
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [treatmentArea, setTreatmentArea] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;

    try {
      // Buscar dados da clínica do usuário
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) {
        return;
      }

      const clinic = clinicData[0];

      // Buscar pacientes da clínica
      const { data: patientsData, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinic.clinic_id)
        .order('full_name');

      if (error) throw error;
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
    }
  }, []);

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma foto",
        variant: "destructive"
      });
      return;
    }

    if (!photoType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo da foto",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Buscar dados da clínica do usuário
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user?.id });

      if (!clinicData || clinicData.length === 0) {
        throw new Error('Clínica não encontrada');
      }

      const clinic = clinicData[0];

      // Salvar dados da foto
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Por enquanto, usar uma URL placeholder que simula uma imagem real
        const photoUrl = `https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Foto+${i + 1}`;
        
        const { error: photoError } = await supabase
          .from('patient_photos')
          .insert({
            patient_id: selectedPatientId,
            clinic_id: clinic.clinic_id,
            professional_id: clinic.professional_id,
            photo_url: photoUrl,
            photo_type: photoType,
            description: description || null,
            session_date: sessionDate || null,
            treatment_area: treatmentArea || null,
            created_by: user?.id
          });

        if (photoError) throw photoError;
      }

      toast({
        title: "Fotos enviadas!",
        description: `${files.length} foto(s) foram enviadas com sucesso`
      });

      // Limpar formulário
      setFiles(null);
      setPhotoType('');
      setDescription('');
      setSessionDate('');
      setTreatmentArea('');
      setSelectedPatientId('');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as fotos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Image className="h-5 w-5" />
            <span>Upload de Fotos</span>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patient-select">Paciente</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo-upload">Selecionar Fotos</Label>
          <Input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {files && (
            <p className="text-sm text-gray-600">
              {files.length} arquivo(s) selecionado(s)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="photo-type">Tipo da Foto</Label>
            <Select value={photoType} onValueChange={setPhotoType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Antes</SelectItem>
                <SelectItem value="after">Depois</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-date">Data da Sessão</Label>
            <Input
              id="session-date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="treatment-area">Área do Tratamento</Label>
          <Select value={treatmentArea} onValueChange={setTreatmentArea}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facial">Facial</SelectItem>
              <SelectItem value="corporal">Corporal</SelectItem>
              <SelectItem value="capilar">Capilar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (Opcional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a foto ou procedimento"
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleUpload} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Enviar Fotos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadFotos;
