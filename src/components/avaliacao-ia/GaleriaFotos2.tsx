import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Search, Filter, Eye, Calendar, User, MapPin, Plus, AlertCircle, ArrowLeft, Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface PatientPhoto {
  id: string;
  photo_url: string;
  patient_id: string;
  photo_type: string;
  description?: string;
  session_date?: string;
  treatment_area?: string;
  created_at: string;
  patients?: {
    full_name: string;
  };
  full_name?: string;
}

interface Patient {
  id: string;
  full_name: string;
}

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

const GaleriaFotos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotoPatientId, setNewPhotoPatientId] = useState<string>('');
  const [newPhotoType, setNewPhotoType] = useState<string>('antes');
  const [newPhotoDescription, setNewPhotoDescription] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: clinicDataResult } = await supabase.rpc('get_user_clinic_data', { user_uuid: user.id });
      const clinicData = clinicDataResult as { clinic_id: string; clinic_name: string; professional_id: string | null }[];

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
        return;
      }

      const photosWithFullName = data.map(p => ({
        ...p,
        full_name: p.patients?.full_name || 'Paciente Desconhecido'
      }));

      setPhotos(photosWithFullName);

    } catch (error) {
      console.error('Erro na lógica de buscar fotos:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao carregar as fotos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      const { data: clinicDataResult } = await supabase.rpc('get_user_clinic_data', { user_uuid: user.id });
      const clinicData = clinicDataResult as { clinic_id: string; clinic_name: string; professional_id: string | null }[];

      if (!clinicData || clinicData.length === 0 || !clinicData[0].clinic_id) {
        setPatients([]);
        return;
      }
      const clinicId = clinicData[0].clinic_id;

      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinicId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPhotos();
    fetchPatients();
  }, [fetchPhotos, fetchPatients]);

  const handleUploadPhoto = async () => {
    if (!newPhotoFile || !newPhotoPatientId || !user) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um paciente e uma imagem para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: clinicDataResult } = await supabase.rpc('get_user_clinic_data', { user_uuid: user.id });
      const clinicData = clinicDataResult as { clinic_id: string; clinic_name: string; professional_id: string | null }[];

      if (!clinicData || clinicData.length === 0 || !clinicData[0].clinic_id) {
        throw new Error('Não foi possível identificar a clínica do usuário.');
      }
      const clinicId = clinicData[0].clinic_id;

      const imageConfig = { maxWidthOrHeight: 1024, maxSizeMB: 2, minWidth: 400, minHeight: 400 };
      
      try {
        const { width, height } = await getImageDimensions(newPhotoFile);
        if (width < imageConfig.minWidth || height < imageConfig.minHeight) {
          toast({
            title: 'Qualidade da Imagem',
            description: `A imagem é pequena (${width}x${height}). Recomendamos pelo menos ${imageConfig.minWidth}x${imageConfig.minHeight} pixels.`,
            variant: 'default',
            duration: 8000,
          });
        }
      } catch (e) {
        console.warn("Não foi possível verificar as dimensões da imagem, continuando com o upload.", e);
      }

      // Use original file without processing
      const file = newPhotoFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${newPhotoPatientId}-${Date.now()}.${fileExt}`;
      const filePath = `${clinicId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('patient_photos').insert({
        patient_id: newPhotoPatientId,
        clinic_id: clinicId,
        photo_url: publicUrl,
        photo_type: newPhotoType,
        description: newPhotoDescription,
        uploaded_by: user.id,
      });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'Sucesso!',
        description: 'A foto foi enviada e salva na galeria.',
      });

      setNewPhotoFile(null);
      setNewPhotoPatientId('');
      setNewPhotoType('antes');
      setNewPhotoDescription('');
      setIsUploadDialogOpen(false);
      fetchPhotos();

    } catch (error: any) {
      console.error('Erro no upload da foto:', error);
      toast({
        title: 'Erro no Upload',
        description: error.message || 'Não foi possível enviar a foto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const patientName = photo.full_name?.toLowerCase() || '';
    const description = photo.description?.toLowerCase() || '';
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch = patientName.includes(searchTermLower) || description.includes(searchTermLower);
    const matchesPatient = filterPatient === 'all' || photo.patient_id === filterPatient;
    const matchesType = filterType === 'all' || photo.photo_type === filterType;

    return matchesSearch && matchesPatient && matchesType;
  });

  const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
    const patientName = photo.full_name || 'Paciente Desconhecido';
    if (!acc[patientName]) {
      acc[patientName] = [];
    }
    acc[patientName].push(photo);
    return acc;
  }, {} as Record<string, PatientPhoto[]>);

  const getPhotoTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      antes: 'Antes',
      depois: 'Depois',
      acompanhamento: 'Acompanhamento',
      outro: 'Outro',
    };
    return labels[type] || 'Desconhecido';
  };

  const getPhotoTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      antes: 'bg-blue-500',
      depois: 'bg-green-500',
      acompanhamento: 'bg-yellow-500',
      outro: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Carregando galeria de fotos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Galeria de Fotos</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros e Ações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Select value={filterPatient} onValueChange={setFilterPatient}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pacientes</SelectItem>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="antes">Antes</SelectItem>
                  <SelectItem value="depois">Depois</SelectItem>
                  <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Foto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Foto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="patient" className="text-right">Paciente</Label>
                    <Select value={newPhotoPatientId} onValueChange={setNewPhotoPatientId} disabled={isUploading}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tipo</Label>
                    <Select value={newPhotoType} onValueChange={setNewPhotoType} disabled={isUploading}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="antes">Antes</SelectItem>
                        <SelectItem value="depois">Depois</SelectItem>
                        <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descrição</Label>
                    <Input id="description" value={newPhotoDescription} onChange={(e) => setNewPhotoDescription(e.target.value)} className="col-span-3" disabled={isUploading} />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Imagem</Label>
                    <div className="col-span-3">
                      <div
                        className={`w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 transition-colors ${isUploading ? 'cursor-wait' : 'cursor-pointer hover:border-blue-500'}`}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                      >
                        {newPhotoFile ? (
                          <img src={URL.createObjectURL(newPhotoFile)} alt="Preview" className="max-h-full max-w-full object-contain p-2" />
                        ) : (
                          <div className="text-center text-gray-400">
                            <Upload className="mx-auto h-8 w-8" />
                            <p>Clique para enviar</p>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => e.target.files && setNewPhotoFile(e.target.files[0])}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleUploadPhoto} disabled={isUploading || !newPhotoFile || !newPhotoPatientId}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? 'Enviando...' : 'Salvar Foto'}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {Object.keys(groupedPhotos).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-12">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">Nenhuma foto encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Filtre os resultados ou adicione a primeira foto.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPhotos).map(([patientName, photos]) => (
            <Card key={patientName}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{patientName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {photos.map(photo => (
                    <Dialog key={photo.id}>
                      <DialogTrigger asChild>
                        <div className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg">
                          <img
                            src={photo.photo_url}
                            alt={photo.description || 'Foto do paciente'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className={`${getPhotoTypeColor(photo.photo_type)} text-white`}>
                              {getPhotoTypeLabel(photo.photo_type)}
                            </Badge>
                          </div>
                          {photo.session_date && (
                            <div className="absolute bottom-2 left-2 right-2">
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(photo.session_date).toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Camera className="h-5 w-5" />
                            <span>{patientName}</span>
                            <Badge className={`${getPhotoTypeColor(photo.photo_type)} text-white`}>
                              {getPhotoTypeLabel(photo.photo_type)}
                            </Badge>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <img
                              src={photo.photo_url}
                              alt={photo.description || 'Foto do paciente'}
                              className="w-full rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <div className="space-y-4">
                            {photo.description && (
                              <div>
                                <h4 className="font-medium mb-2">Descrição</h4>
                                <p className="text-gray-600 dark:text-gray-400">{photo.description}</p>
                              </div>
                            )}
                            {photo.treatment_area && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>Área de Tratamento</span>
                                </h4>
                                <p className="text-gray-600 dark:text-gray-400">{photo.treatment_area}</p>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium mb-2 flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Data da Sessão</span>
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400">
                                {photo.session_date 
                                  ? new Date(photo.session_date).toLocaleDateString('pt-BR')
                                  : new Date(photo.created_at).toLocaleDateString('pt-BR')
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GaleriaFotos;
