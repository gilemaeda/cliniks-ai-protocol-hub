import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvaluationsQuery } from './useEvaluationsQuery';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(() => ({
      mockResolvedValue: (value: any) => {
        jest.fn().mockResolvedValue(value);
        return { data: [{ clinic_id: 'clinic-123' }] };
      }
    })),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            assessment_type: 'facial',
            created_at: '2025-01-01T12:00:00Z',
            professionals: {
              id: 'prof-1',
              user_id: 'user-123',
              profiles: {
                full_name: 'Dr. Teste',
                email: 'teste@exemplo.com'
              }
            }
          }
        ],
        error: null
      })
    }))
  }
}));

describe('useEvaluationsQuery', () => {
  function getWrapper() {
    const queryClient = new QueryClient();
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  }

  it('deve retornar lista de avaliações quando userId está definido', async () => {
    const wrapper = getWrapper();
    const { result } = renderHook(() => useEvaluationsQuery('user-123'), { wrapper });
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].professionals.profiles.full_name).toBe('Dr. Teste');
  });

  it('não faz fetch se userId não está definido', async () => {
    const wrapper = getWrapper();
    const { result } = renderHook(() => useEvaluationsQuery(undefined), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
