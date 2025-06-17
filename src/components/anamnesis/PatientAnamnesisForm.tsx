
import { useState } from 'react';
import AnamnesisFormHeader from './forms/AnamnesisFormHeader';
import AnamnesisFormTabs from './forms/AnamnesisFormTabs';
import { useAnamnesisForm } from './hooks/useAnamnesisForm';

interface PatientAnamnesisFormProps {
  selectedPatient?: any;
  selectedArea?: 'facial' | 'corporal' | 'capilar';
  clinic?: any;
  onCancel: () => void;
  onSave: () => void;
}

const PatientAnamnesisForm = ({ 
  selectedPatient, 
  selectedArea = 'facial', 
  clinic,
  onCancel,
  onSave 
}: PatientAnamnesisFormProps) => {
  const { 
    formData, 
    updateFormData, 
    saveAnamnesis, 
    loading,
    selectedPatientId,
    setSelectedPatientId,
    patients
  } = useAnamnesisForm(
    selectedPatient?.id,
    selectedArea,
    clinic?.id
  );

  const handleSave = async () => {
    try {
      await saveAnamnesis();
      onSave();
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error);
    }
  };

  return (
    <div className="space-y-6">
      <AnamnesisFormHeader
        onCancel={onCancel}
        onSave={handleSave}
        selectedPatient={selectedPatient}
        selectedArea={selectedArea}
        clinic={clinic}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onPatientChange={setSelectedPatientId}
        loading={loading}
      />
      
      <AnamnesisFormTabs
        selectedArea={selectedArea}
        formData={formData}
        onUpdateFormData={updateFormData}
      />
    </div>
  );
};

export default PatientAnamnesisForm;
