import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Camera, Search, Filter, Eye, Calendar, User, Plus, AlertCircle, Loader2, Upload, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { processImage } from '@/lib/imageProcessor';
import { Label } from '@/components/ui/label';

interface Patient {
  id: string;
  full_name: string;
}

const treatmentAreas = [
  { value: 'facial', label: 'Facial' },
  { value: 'corporal', label: 'Corporal' },
  { value: 'capilar', label: 'Capilar' },
];

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Falha ao ler o arquivo de imagem.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface PatientPhoto {
  id: string;
  photo_url: string;
  patient_id: string;
  photo_type: string;
  treatment_area: string;
  description?: string;
  session_date?: string;
  created_at: string;
  patients?: {
    full_name: string;
  };
  full_name?: string;
}

const GaleriaFotos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotoPatientId, setNewPhotoPatientId] = useState<string>('');
  const [newPhotoType, setNewPhotoType] = useState<string>('antes');
  const [newPhotoArea, setNewPhotoArea] = useState<string>('facial');
  const [newPhotoDescription, setNewPhotoDescription] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: clinicDataResult } = await supabase.rpc('get_user_clinic_data', { user_uuid: user.id });
      const clinicData = clinicDataResult as { clinic_id: string; role: string }[];

      if (!clinicData || clinicData.length === 0 || !clinicData[0].clinic_id) {
        toast({ title: "Aviso", description: "Clínica não encontrada. Associe seu perfil a uma clínica para ver as fotos." });
        setPhotos([]);
        setLoading(false);
        return;
      }
      const clinicId = clinicData[0].clinic_id;

      const { data, error } = await supabase
        .from('patient_photos')
        .select('*, patients(full_name)')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fotos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as fotos da galeria.",
          variant: "destructive"
        });
        setPhotos([]);
        setLoading(false);
        return;
      }

        const photosWithUrlsPromises = data.map(async (photo) => {
          let imagePath = photo.photo_url;
          console.log('DB photo_url:', imagePath); // Log para depuração

          if (!imagePath) {
            console.warn('Caminho da imagem vazio para o paciente:', photo.patients?.full_name);
            return { ...photo, photo_url: '', full_name: photo.patients?.full_name || 'Paciente desconhecido' };
          }

          // Lógica de extração de caminho universal e robusta
          const bucketIdentifier = '/patient-photos/';
          if (imagePath.includes(bucketIdentifier)) {
            imagePath = imagePath.substring(imagePath.indexOf(bucketIdentifier) + bucketIdentifier.length);
          }
          console.log('Caminho extraído:', imagePath); // Log para depuração

          if (!imagePath) {
            console.error('Não foi possível extrair um caminho válido de:', photo.photo_url);
            return { ...photo, photo_url: '', full_name: photo.patients?.full_name || 'Paciente desconhecido' };
          }

          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('patient-photos')
            .createSignedUrl(imagePath, 3600); // Validade de 1 hora

          if (signedUrlError) {
            console.error('Erro ao criar URL assinada para o caminho:', imagePath, signedUrlError);
            return { ...photo, photo_url: '', full_name: photo.patients?.full_name || 'Paciente desconhecido' };
          }

          console.log('URL assinada gerada:', signedUrlData.signedUrl); // Log para depuração

          return {
            ...photo,
            photo_url: signedUrlData.signedUrl,
            full_name: photo.patients?.full_name || 'Paciente desconhecido'
          };
        });
        const photosWithUrls = await Promise.all(photosWithUrlsPromises);
        setPhotos(photosWithUrls);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      let errorMessage = "Não foi possível carregar as fotos da galeria.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    const { data: clinicDataResult } = await supabase.rpc('get_user_clinic_data', { user_uuid: user.id });
    const clinicData = clinicDataResult as { clinic_id: string; role: string }[];
    if (!clinicData || clinicData.length === 0) return;
    const clinicId = clinicData[0].clinic_id;

    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('clinic_id', clinicId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pacientes:', error);
    } else {
      setPatients(data || []);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotos();
    fetchPatients();
  }, [fetchPhotos, fetchPatients]);

  const handleUploadPhoto = async () => {
    if (!newPhotoFile || !newPhotoPatientId || !user) return;

    setIsUploading(true);

    try {
      const { width, height } = await getImageDimensions(newPhotoFile);
      if (width < 800 || height < 600) {
        toast({ title: 'Qualidade da Imagem Baixa', description: 'Para garantir a qualidade, envie imagens com pelo menos 800x600 pixels.', variant: 'destructive' });
        setIsUploading(false);
        return;
      }

      const processedFile = await processImage(newPhotoFile, { maxSizeMB: 2, maxWidthOrHeight: 1920 });

      const { data: clinicDataResult } = await supabase.rpc('get_user_clinic_data', { user_uuid: user.id });
      const clinicData = clinicDataResult as { clinic_id: string; role: string }[];
      if (!clinicData || clinicData.length === 0) throw new Error('Usuário não associado a uma clínica.');
      const clinicId = clinicData[0].clinic_id;

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${newPhotoPatientId}_${new Date().toISOString()}.${fileExt}`;
      const filePath = `${clinicId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage.from('patient-photos').upload(filePath, processedFile);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('patient_photos').insert({
        patient_id: newPhotoPatientId,
        clinic_id: clinicId,
        uploaded_by: user.id,
        photo_url: filePath, // Salva o caminho do arquivo em vez da URL completa
        photo_type: newPhotoType,
        treatment_area: newPhotoArea,
        description: newPhotoDescription,
        session_date: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      toast({ title: 'Sucesso!', description: 'Foto enviada com sucesso.' });
      setIsUploadDialogOpen(false);
      setNewPhotoFile(null);
      setNewPhotoDescription('');
      setNewPhotoPatientId('');
      fetchPhotos();
    } catch (error) {
      setIsUploading(false);
      console.error('Erro no upload:', error);
      let errorMessage = "Não foi possível enviar a foto.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro no Upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPhotos = photos
    .filter(photo => photo.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(photo => filterPatient === 'all' || photo.patient_id === filterPatient)
    .filter(photo => filterType === 'all' || photo.photo_type === filterType)
    .filter(photo => filterArea === 'all' || photo.treatment_area === filterArea);

  const recentPhotos = photos.slice(0, 4);

  const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
    const patientName = photo.full_name || 'Paciente Desconhecido';
    if (!acc[patientName]) {
      acc[patientName] = {};
    }
    const photoType = photo.photo_type;
    if (!acc[patientName][photoType]) {
      acc[patientName][photoType] = [];
    }
    acc[patientName][photoType].push(photo);
    return acc;
  }, {} as Record<string, Record<string, PatientPhoto[]>>);

  const getPhotoTypeLabel = (type: string) => {
    const labels: Record<string, string> = { antes: 'Antes', depois: 'Depois', acompanhamento: 'Acompanhamento', outro: 'Outro' };
    return labels[type] || type;
  };

  const getPhotoTypeColor = (type: string) => {
    const colors: Record<string, string> = { antes: 'bg-blue-500', depois: 'bg-green-500', acompanhamento: 'bg-yellow-500', outro: 'bg-gray-500' };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar ao Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Filter /><span>Filtros e Ações</span></CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Buscar por paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterPatient} onValueChange={setFilterPatient}>
            <SelectTrigger className="w-full md:w-auto"><SelectValue placeholder="Todos os Pacientes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Pacientes</SelectItem>
              {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-auto"><SelectValue placeholder="Todos os Tipos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="antes">Antes</SelectItem>
              <SelectItem value="depois">Depois</SelectItem>
              <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-full md:w-auto"><SelectValue placeholder="Todas as Áreas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Áreas</SelectItem>
              {treatmentAreas.map(area => <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="md:ml-auto w-full md:w-auto">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild><Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Adicionar Foto</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader><DialogTitle>Adicionar Nova Foto</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patient-select">Paciente</Label>
                    <Select value={newPhotoPatientId} onValueChange={setNewPhotoPatientId}>
                      <SelectTrigger id="patient-select"><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
                      <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type-select">Tipo de Foto</Label>
                      <Select value={newPhotoType} onValueChange={setNewPhotoType}>
                        <SelectTrigger id="type-select"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="antes">Antes</SelectItem>
                          <SelectItem value="depois">Depois</SelectItem>
                          <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="area-select">Área de Tratamento</Label>
                      <Select value={newPhotoArea} onValueChange={setNewPhotoArea}>
                        <SelectTrigger id="area-select"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                        <SelectContent>{treatmentAreas.map(area => <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Input id="description" value={newPhotoDescription} onChange={(e) => setNewPhotoDescription(e.target.value)} placeholder="Ex: Rosto, perfil direito" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Arquivo da Foto</Label>
                    <Input type="file" accept="image/jpeg, image/png, image/webp" ref={fileInputRef} onChange={(e) => setNewPhotoFile(e.target.files ? e.target.files[0] : null)} className="cursor-pointer" />
                    {newPhotoFile && <p className="text-sm text-gray-500">{newPhotoFile.name}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
                  <Button onClick={handleUploadPhoto} disabled={isUploading || !newPhotoFile || !newPhotoPatientId}>
                    {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="mr-2 h-4 w-4" />Enviar Foto</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {recentPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Sparkles className="h-5 w-5 text-yellow-400" /><span>Adicionadas Recentemente</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={photo.photo_url} alt={`Foto de ${photo.full_name}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="sm"><Eye className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-2">
                    <p className="font-semibold text-sm truncate">{photo.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getPhotoTypeLabel(photo.photo_type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(groupedPhotos).length === 0 && searchTerm && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma foto encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mt-2">Nenhuma foto corresponde aos filtros aplicados. Tente ajustar seus critérios de busca.</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedPhotos).map(([patientName, photosByType]) => (
          <Card key={patientName}>
            <CardHeader><CardTitle className="flex items-center space-x-2"><User className="h-5 w-5" /><span>{patientName}</span></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(photosByType).map(([photoType, photosOfType]) => (
                <div key={photoType}>
                  <h4 className="font-semibold text-md mb-2 flex items-center">
                    <Badge className={`${getPhotoTypeColor(photoType)} mr-2`}>{getPhotoTypeLabel(photoType)}</Badge>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photosOfType.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={photo.photo_url} alt={`Foto de ${patientName}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button variant="secondary" size="sm"><Eye className="h-4 w-4" /></Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {photo.session_date && (
                            <Badge variant="outline" className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{new Date(photo.session_date).toLocaleDateString()}</Badge>
                          )}
                          {photo.treatment_area && (
                            <Badge variant="secondary">{treatmentAreas.find(a => a.value === photo.treatment_area)?.label}</Badge>
                          )}
                        </div>
                        {photo.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{photo.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GaleriaFotos;
