import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatientsQuery } from './usePatientsQuery';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [{ id: '1', full_name: 'Paciente Teste' }], error: null })
    }))
  }
}));

describe('usePatientsQuery', () => {
  function getWrapper() {
    const queryClient = new QueryClient();
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  }

  it('deve retornar lista de pacientes quando userId está definido', async () => {
    const wrapper = getWrapper();
    const { result } = renderHook(() => usePatientsQuery('user-123'), { wrapper });
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].full_name).toBe('Paciente Teste');
  });

  it('não faz fetch se userId não está definido', async () => {
    const wrapper = getWrapper();
    const { result } = renderHook(() => usePatientsQuery(undefined), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
