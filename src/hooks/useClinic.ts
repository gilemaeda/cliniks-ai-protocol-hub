import { useContext } from 'react';
import { ClinicContext } from '@/contexts/ClinicContext';

/**
 * Hook para acessar os dados da clínica, status do plano e outras informações.
 * Deve ser usado dentro de um componente filho do ClinicProvider.
 */
export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic deve ser usado dentro de um ClinicProvider');
  }
  return context;
};
