
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import FormularioAvaliacao from './FormularioAvaliacao';
import { supabase as supabaseClientMock } from '@/integrations/supabase/client';

const toastMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => {
  const mockRpc = jest.fn().mockImplementation((methodName) => {
    console.log(`[SUPA_MOCK_RPC] Chamada: ${methodName}`);
    if (methodName === 'get_user_clinic_data') {
      return Promise.resolve({ data: [{ clinic_id: 'clinic-1' }], error: null });
    }
    if (methodName === 'get_remaining_uses') {
      return Promise.resolve({ data: 10, error: null });
    }
    return Promise.resolve({ data: null, error: { message: 'RPC não mockado' } });
  });

  const mockFrom = jest.fn((tableName: string) => {
    console.log(`[SUPA_MOCK_FROM] Tabela: ${tableName}`);
    if (tableName === 'patients') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn((column, value) => {
          console.log(`[SUPA_MOCK_PATIENTS_EQ] Coluna: ${column}, Valor: ${value}`);
          return {
            order: jest.fn((orderCol, opts) => {
              console.log(`[SUPA_MOCK_PATIENTS_ORDER] Coluna: ${orderCol}, Opções: ${JSON.stringify(opts)}`);
              if (column === 'clinic_id' && value === 'clinic-1') {
                return Promise.resolve({
                  data: [
                    { id: 'p1', full_name: 'Paciente Existente 1', age: 30 },
                    { id: 'p2', full_name: 'Paciente Existente 2', age: 45 },
                  ],
                  error: null,
                });
              }
              return Promise.resolve({ data: [], error: { message: 'Pacientes não encontrados (mock)' } });
            }),
          };
        }),
      };
    }
    if (tableName === 'clinic_resources') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn((column, value) => {
          console.log(`[SUPA_MOCK_RESOURCES_EQ] Coluna: ${column}, Valor: ${value}`);
          if (column === 'clinic_id' && value === 'clinic-1'){
              return Promise.resolve({ data: [{id: 'res1', name: 'Recurso 1', clinic_id: 'clinic-1'}], error: null });
          }
          return Promise.resolve({ data: [], error: { message: 'Recursos não encontrados (mock)' } });
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null, data: [{id: 'mock_insert_id'}] }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
  });

  return {
    supabase: {
      rpc: mockRpc,
      from: mockFrom,
    },
  };
});

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

describe('FormularioAvaliacao', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined') {
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
    }
  });
  
  beforeEach(() => {
    toastMock.mockClear();
  });

  it('renderiza campos essenciais', () => {
    render(<FormularioAvaliacao onCancel={jest.fn()} onSuccess={jest.fn()} />);
    expect(screen.getByText(/formulário de avaliação com ia/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar avaliação/i })).toBeInTheDocument();
  });

  it('exibe toast de erro ao buscar pacientes', async () => {
    (supabaseClientMock.rpc as jest.Mock).mockRejectedValueOnce(new Error('Erro RPC'));
    render(<FormularioAvaliacao onCancel={jest.fn()} onSuccess={jest.fn()} />);
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/erro/i), variant: 'destructive' })
      );
    });
  });

  it('submete avaliação com sucesso', async () => {
    render(<FormularioAvaliacao onCancel={jest.fn()} onSuccess={jest.fn()} />);
    
    await waitFor(() => {
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /iniciar avaliação/i }));
    
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/erro/i), variant: 'destructive' })
      );
    });
  });

  it('valida campos obrigatórios', async () => {
    render(<FormularioAvaliacao onCancel={jest.fn()} onSuccess={jest.fn()} />);
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar avaliação/i }));
    
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/erro/i), variant: 'destructive' })
      );
    });
  });
});
