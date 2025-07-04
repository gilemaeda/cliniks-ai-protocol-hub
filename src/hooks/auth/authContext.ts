import { createContext, useContext } from 'react';
import { AuthState, AuthActions } from './types';

// Cria o contexto de autenticação com um valor inicial indefinido.
export const AuthContext = createContext<(AuthState & AuthActions) | undefined>(undefined);

/**
 * Hook customizado para acessar o contexto de autenticação.
 * Garante que o hook seja usado dentro de um AuthProvider.
 * @returns O contexto de autenticação, contendo estado e ações.
 */
export const useAuth = (): AuthState & AuthActions => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
