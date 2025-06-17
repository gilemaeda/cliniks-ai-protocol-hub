
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface AnamnesisFormHeaderProps {
  onCancel: () => void;
  onSave: () => void;
  selectedPatient?: any;
  selectedArea: 'facial' | 'corporal' | 'capilar';
  clinic?: any;
  patients: any[];
  selectedPatientId: string;
  onPatientChange: (patientId: string) => void;
  loading: boolean;
}

const AnamnesisFormHeader = ({
  onCancel,
  onSave,
  selectedPatient,
  selectedArea,
  clinic,
  patients,
  selectedPatientId,
  onPatientChange,
  loading
}: AnamnesisFormHeaderProps) => {
  const getAreaName = (area: string) => {
    switch (area) {
      case 'facial':
        return 'Facial';
      case 'corporal':
        return 'Corporal';
      case 'capilar':
        return 'Capilar';
      default:
        return area;
    }
  };

  const getAreaIcon = (area: string) => {
    switch (area) {
      case 'facial':
        return '👤';
      case 'corporal':
        return '🏃‍♀️';
      case 'capilar':
        return '💇‍♀️';
      default:
        return '📋';
    }
  };

  const getAreaColor = (area: string) => {
    switch (area) {
      case 'facial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'corporal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'capilar':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const selectedPatientData = patients.find(p => p.id === selectedPatientId);

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nova Anamnese
            </h1>
            <Badge className={`${getAreaColor(selectedArea)} flex items-center gap-1 px-3 py-1`}>
              <span>{getAreaIcon(selectedArea)}</span>
              {getAreaName(selectedArea)}
            </Badge>
          </div>
          
          <Button 
            onClick={onSave} 
            disabled={loading || !selectedPatientId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Anamnese'}
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3 mb-3">
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações do Paciente
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-select" className="text-sm font-medium">
                Selecionar Paciente *
              </Label>
              <Select value={selectedPatientId} onValueChange={onPatientChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um paciente para a anamnese" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {patient.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patients.length === 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Nenhum paciente encontrado. Cadastre pacientes primeiro.
                </p>
              )}
            </div>
            
            {selectedPatientData && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dados do Paciente</Label>
                <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedPatientData.full_name}
                  </p>
                  {selectedPatientData.age && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Idade: {selectedPatientData.age} anos
                    </p>
                  )}
                  {selectedPatientData.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {selectedPatientData.email}
                    </p>
                  )}
                  {selectedPatientData.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Telefone: {selectedPatientData.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {selectedPatientId && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ✅ Paciente selecionado! Preencha os formulários abaixo para completar a anamnese {getAreaName(selectedArea).toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnamnesisFormHeader;
