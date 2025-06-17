import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Search, Filter, Eye, Calendar, User, MapPin, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface Patient {
  id: string;
  full_name: string;
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
  const [selectedPhoto, setSelectedPhoto] = useState<PatientPhoto | null>(null);

  useEffect(() => {
    fetchPhotos();
    fetchPatients();
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar dados da clínica/profissional
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) {
        console.log('Nenhum dado de clínica encontrado');
        setPhotos([]);
        return;
      }

      const clinic = clinicData[0];
      
      let query = supabase
        .from('patient_photos')
        .select(`
          id,
          photo_url,
          patient_id,
          photo_type,
          description,
          session_date,
          treatment_area,
          created_at,
          patients!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por clínica ou profissional
      if (clinic.clinic_id) {
        query = query.eq('clinic_id', clinic.clinic_id);
      }

      const { data: photosData, error } = await query;

      if (error) {
        console.error('Erro ao buscar fotos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as fotos",
          variant: "destructive"
        });
        return;
      }

      console.log('Fotos carregadas:', photosData);
      setPhotos(photosData || []);
      
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar as fotos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    if (!user) return;

    try {
      const { data: clinicData } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (!clinicData || clinicData.length === 0) return;

      const clinic = clinicData[0];
      if (!clinic.clinic_id) return;

      const { data: patientsData, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinic.clinic_id)
        .order('full_name');

      if (!error) {
        setPatients(patientsData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.treatment_area?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = filterPatient === 'all' || photo.patient_id === filterPatient;
    const matchesType = filterType === 'all' || photo.photo_type === filterType;
    
    return matchesSearch && matchesPatient && matchesType;
  });

  const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
    const patientName = photo.patients?.full_name || 'Paciente Desconhecido';
    if (!acc[patientName]) {
      acc[patientName] = [];
    }
    acc[patientName].push(photo);
    return acc;
  }, {} as Record<string, PatientPhoto[]>);

  const getPhotoTypeLabel = (type: string) => {
    const types = {
      'before': 'Antes',
      'after': 'Depois',
      'during': 'Durante',
      'progress': 'Progresso'
    };
    return types[type as keyof typeof types] || type;
  };

  const getPhotoTypeColor = (type: string) => {
    const colors = {
      'before': 'bg-red-500',
      'after': 'bg-green-500',
      'during': 'bg-yellow-500',
      'progress': 'bg-blue-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Camera className="h-12 w-12 animate-pulse mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Carregando galeria de fotos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Galeria de Fotos
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Organize e compare fotos de evolução dos tratamentos
            </p>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paciente</label>
              <Select value={filterPatient} onValueChange={setFilterPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os pacientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Foto</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="before">Antes</SelectItem>
                  <SelectItem value="after">Depois</SelectItem>
                  <SelectItem value="during">Durante</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Galeria de Fotos */}
      {Object.keys(groupedPhotos).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma foto encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {photos.length === 0 
                ? "Ainda não há fotos cadastradas na galeria."
                : "Nenhuma foto corresponde aos filtros aplicados."
              }
            </p>
            <Button onClick={() => window.location.href = '/patients'}>
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Pacientes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([patientName, patientPhotos]) => (
            <Card key={patientName}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{patientName}</span>
                  <Badge variant="secondary">{patientPhotos.length} foto(s)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {patientPhotos.map((photo) => (
                    <Dialog key={photo.id}>
                      <DialogTrigger asChild>
                        <div className="relative group cursor-pointer">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img
                              src={photo.photo_url}
                              alt={photo.description || 'Foto do paciente'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', photo.photo_url);
                                // Usar uma imagem placeholder local ou um ícone
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                    <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>`;
                              }}
                            />
                          </div>
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                          
                          <div className="absolute top-2 left-2">
                            <Badge className={`${getPhotoTypeColor(photo.photo_type)} text-white text-xs`}>
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
                          <div className="space-y-4">
                            <img
                              src={photo.photo_url}
                              alt={photo.description || 'Foto do paciente'}
                              className="w-full rounded-lg"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', photo.photo_url);
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
