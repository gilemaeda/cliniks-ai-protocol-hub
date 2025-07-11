import { renderHook, act } from '@testing-library/react';
import { useAdminAuth } from './useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { vi } from 'vitest';

// Mock do módulo supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn()
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do hook use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('deve inicializar com valores padrão', async () => {
    // Configurar mock para getSession retornando sessão vazia
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    // Configurar mock para from().select().eq().eq().single() retornando dados vazios
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Usuário não encontrado' }
            })
          })
        })
      })
    } as any);

    const { result } = renderHook(() => useAdminAuth());

    // Verificar estado inicial
    expect(result.current.adminUser).toBeNull();
    expect(result.current.adminSession).toBeNull();
    expect(result.current.adminLoading).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('deve fazer login administrativo com sucesso', async () => {
    // Mock para signInWithPassword
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: { access_token: 'token123' } as any,
        user: { email: 'admin@example.com' } as any
      },
      error: null
    });

    // Mock para verificação de admin
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: '123',
                email: 'admin@example.com',
                full_name: 'Admin Test',
                is_master: false,
                is_active: true,
                created_at: '2023-01-01'
              },
              error: null
            })
          })
        })
      })
    } as any);

    const { result } = renderHook(() => useAdminAuth());

    // Executar login
    await act(async () => {
      await result.current.adminLogin('admin@example.com', 'password123');
    });

    // Verificar se o login foi bem-sucedido
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.adminUser).toEqual({
      id: '123',
      email: 'admin@example.com',
      full_name: 'Admin Test',
      is_master: false,
      is_active: true,
      created_at: '2023-01-01'
    });
    
    // Verificar se os dados foram salvos no localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cliniks_admin_auth', 'authenticated');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cliniks_admin_data', expect.any(String));
  });

  it('deve fazer logout administrativo com sucesso', async () => {
    // Configurar mock para signOut
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null
    });

    // Configurar estado inicial com usuário logado
    localStorageMock.setItem('cliniks_admin_auth', 'authenticated');
    localStorageMock.setItem('cliniks_admin_data', JSON.stringify({
      id: '123',
      email: 'admin@example.com',
      full_name: 'Admin Test',
      is_master: false,
      is_active: true,
      created_at: '2023-01-01'
    }));

    const { result } = renderHook(() => useAdminAuth());

    // Executar logout
    await act(async () => {
      await result.current.adminLogout();
    });

    // Verificar se o logout foi bem-sucedido
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.adminUser).toBeNull();
    
    // Verificar se os dados foram removidos do localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cliniks_admin_auth');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cliniks_admin_data');
  });

  it('deve verificar status de admin com sucesso', async () => {
    // Mock para verificação de admin
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: '123',
                email: 'admin@example.com',
                is_active: true
              },
              error: null
            })
          })
        })
      })
    } as any);

    // Configurar estado inicial com usuário admin
    const adminUser = {
      id: '123',
      email: 'admin@example.com',
      full_name: 'Admin Test',
      is_master: false,
      is_active: true,
      created_at: '2023-01-01'
    };

    const { result } = renderHook(() => useAdminAuth());

    // Definir adminUser manualmente para testar verifyAdminStatus
    Object.defineProperty(result.current, 'adminUser', {
      value: adminUser,
      writable: true
    });

    // Executar verificação de status
    let isAdmin = false;
    await act(async () => {
      isAdmin = await result.current.verifyAdminStatus();
    });

    // Verificar se a verificação foi bem-sucedida
    expect(isAdmin).toBe(true);
  });

  it('deve lidar com erro no login administrativo', async () => {
    // Mock para signInWithPassword com erro
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Credenciais inválidas' } as any
    });

    const { result } = renderHook(() => useAdminAuth());

    // Executar login com erro
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.adminLogin('admin@example.com', 'senha_errada');
      } catch (e) {
        error = e as Error;
      }
    });

    // Verificar se o erro foi capturado
    expect(error).not.toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.adminUser).toBeNull();
    
    // Verificar se os dados não foram salvos no localStorage
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('cliniks_admin_auth', 'authenticated');
  });
});
