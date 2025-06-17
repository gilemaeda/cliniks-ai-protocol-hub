
import { useState } from 'react';
import PatientsList from './PatientsList';
import PatientForm from './PatientForm';
import { Patient } from '@/types/patient';

const PatientsManager = () => {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();

  const handleNewPatient = () => {
    setSelectedPatient(undefined);
    setCurrentView('form');
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('form');
  };

  const handleSuccess = () => {
    setCurrentView('list');
    setSelectedPatient(undefined);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedPatient(undefined);
  };

  return (
    <div className="container mx-auto py-6">
      {currentView === 'list' ? (
        <PatientsList 
          onNewPatient={handleNewPatient}
          onEditPatient={handleEditPatient}
        />
      ) : (
        <PatientForm 
          patient={selectedPatient}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default PatientsManager;
