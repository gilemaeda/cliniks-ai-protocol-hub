import { useState } from 'react';
import { usePatientsQuery } from '@/hooks/usePatientsQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/auth/authContext';
import { Patient } from '@/types/patient';
import { Search, Plus, Edit, Mail, Phone, User, Calendar, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PatientsListProps {
  onNewPatient: () => void;
  onEditPatient: (patient: Patient) => void;
}

const PatientsList = ({ onNewPatient, onEditPatient }: PatientsListProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: patients = [], isLoading: loading, error, refetch } = usePatientsQuery(user?.id);

  if (error) {
    toast({
      title: "Erro ao carregar pacientes",
      description: error.message,
      variant: "destructive"
    });
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pacientes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus pacientes cadastrados
            </p>
        </div>
        <Button onClick={onNewPatient}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar pacientes por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm 
                ? 'Tente usar outros termos de busca'
                : 'Comece cadastrando seu primeiro paciente'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onNewPatient}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Paciente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                  </div>
                  <div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditPatient(patient)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={async () => {
                        if (window.confirm(`Tem certeza que deseja excluir o paciente ${patient.full_name}? Essa ação não pode ser desfeita.`)) {
                          const { error } = await supabase
                            .from('patients')
                            .delete()
                            .eq('id', patient.id);
                          if (error) {
                            toast({
                              title: 'Erro ao excluir paciente',
                              description: error.message,
                              variant: 'destructive'
                            });
                          } else {
                            toast({
                              title: 'Paciente excluído',
                              description: 'O paciente foi removido com sucesso.'
                            });
                            refetch();
                          }
                        }
                      }}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.age && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{patient.age} anos</span>
                    {patient.birth_date && (
                      <Badge variant="outline" className="ml-auto">
                        {formatDate(patient.birth_date)}
                      </Badge>
                    )}
                  </div>
                )}

                {patient.profession && (
                  <div className="text-sm text-gray-600">
                    <strong>Profissão:</strong> {patient.profession}
                  </div>
                )}

                {patient.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
                  </div>
                )}

                {patient.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <Badge variant="secondary" className="text-xs">
                    Cadastrado em {formatDate(patient.created_at)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientsList;
