
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, User, Stethoscope } from 'lucide-react';

interface BasicInfoFormProps {
  selectedPatientId: string;
  selectedArea: 'facial' | 'corporal' | 'capilar';
  patients: any[];
  onPatientChange: (patientId: string) => void;
  onAreaChange: (area: 'facial' | 'corporal' | 'capilar') => void;
  onSave: () => Promise<void>;
  loading: boolean;
}

const BasicInfoForm = ({
  selectedPatientId,
  selectedArea,
  patients,
  onPatientChange,
  onAreaChange,
  onSave,
  loading
}: BasicInfoFormProps) => {
  const getAreaColor = (area: string) => {
    switch (area) {
      case 'facial': return 'bg-blue-500';
      case 'corporal': return 'bg-green-500';
      case 'capilar': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Stethoscope className="h-5 w-5" />
          <span>Informações Básicas da Anamnese</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select value={selectedPatientId} onValueChange={onPatientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{patient.full_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Área de Avaliação *</Label>
            <Select 
              value={selectedArea} 
              onValueChange={(value: 'facial' | 'corporal' | 'capilar') => onAreaChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facial">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Facial</span>
                  </div>
                </SelectItem>
                <SelectItem value="corporal">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Corporal</span>
                  </div>
                </SelectItem>
                <SelectItem value="capilar">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Capilar</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={onSave} 
            disabled={!selectedPatientId || loading}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Anamnese'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
