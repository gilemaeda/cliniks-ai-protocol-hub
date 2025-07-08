import { useContext } from 'react';
import AdminContext from '@/contexts/AdminContext';

/**
 * Hook para acessar o contexto administrativo
 * Deve ser usado dentro de componentes que estão dentro do AdminProvider
 */
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
};

export default useAdmin;
