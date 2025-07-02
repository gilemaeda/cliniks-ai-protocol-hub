import { useClinic } from './useClinic';

/**
 * Hook para centralizar a lógica de controle de acesso baseada no status do plano da clínica.
 * 
 * @returns um objeto com:
 * - `canAccess`: booleano que indica se as ferramentas principais devem ser acessíveis.
 * - `isChecking`: booleano que indica se o status do plano ainda está sendo carregado.
 * - `blockReason`: o motivo do bloqueio ('INACTIVE' ou 'EXPIRED') ou nulo se o acesso for permitido.
 * - `statusLabel`: a etiqueta de status atual para exibição na UI.
 */
export const useAccessControl = () => {
  const { planStatus, planStatusLabel } = useClinic();

  const isChecking = planStatus === 'LOADING';
  const canAccess = planStatus === 'ACTIVE' || planStatus === 'TRIAL';
  
  let blockReason: 'INACTIVE' | 'EXPIRED' | null = null;
  if (!canAccess && !isChecking) {
    blockReason = planStatus === 'INACTIVE' ? 'INACTIVE' : 'EXPIRED';
  }

  return { 
    canAccess, 
    isChecking,
    blockReason, 
    statusLabel: planStatusLabel 
  };
};
