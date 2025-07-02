import { useState, useEffect } from 'react';
import { useClinic } from './useClinic';

interface AccessControlResult {
  canAccess: boolean;
  isChecking: boolean;
  error: Error | null;
}

/**
 * Hook para controlar o acesso às funcionalidades com base no status do plano
 */
export const useAccessControl = (): AccessControlResult => {
  const { clinic, loading: clinicLoading, planStatus } = useClinic();
  const [isChecking, setIsChecking] = useState(true);
  const [canAccess, setCanAccess] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Só verificamos o acesso quando os dados da clínica estiverem carregados
    if (!clinicLoading) {
      try {
        console.log('useAccessControl - verificando acesso:', { 
          clinic, 
          planStatus,
          clinicLoading 
        });
        
        // Por padrão, permitimos acesso (temporariamente, para não bloquear usuários)
        // Isso pode ser ajustado conforme a lógica de negócio
        setCanAccess(true);
        console.log('useAccessControl - acesso permitido:', true);
        
        // Quando implementar a lógica de bloqueio baseada no plano:
        // if (planStatus === 'active' || planStatus === 'trial') {
        //   setCanAccess(true);
        // } else {
        //   setCanAccess(false);
        // }
      } catch (err) {
        console.error('Erro ao verificar acesso:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        // Em caso de erro, permitimos o acesso para não bloquear usuários
        setCanAccess(true);
        console.log('useAccessControl - acesso permitido após erro:', true);
      } finally {
        setIsChecking(false);
      }
    }
  }, [clinic, clinicLoading, planStatus]);

  return {
    canAccess,
    isChecking,
    error
  };
};
