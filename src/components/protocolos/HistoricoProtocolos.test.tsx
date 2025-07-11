import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoricoProtocolos from './HistoricoProtocolos';
import { supabase as supabaseClientMock } from '@/integrations/supabase/client'; // Importar o mock para spyOn

const toastMock = jest.fn();
const refetchMock = jest.fn();
const onEditProtocolMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null })
    }))
  }
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

jest.mock('@/hooks/useProtocolosQuery', () => ({
  useProtocolosQuery: () => ({
    data: [
      {
        id: '1',
        name: 'Protocolo Teste',
        description: 'Descrição',
        content: { generated_protocol: 'Conteúdo gerado' },
        therapeutic_objective: 'Objetivo',
        target_audience: 'Adultos',
        duration_weeks: 4,
        equipment_used: [],
        substances_used: [],
        created_at: new Date().toISOString()
      }
    ],
    isLoading: false,
    error: null,
    refetch: refetchMock
  })
}));

describe('HistoricoProtocolos', () => {
  beforeEach(() => {
    toastMock.mockClear();
    refetchMock.mockClear();
    onEditProtocolMock.mockClear();
  });

  it('renderiza lista de protocolos', () => {
    render(<HistoricoProtocolos onEditProtocol={onEditProtocolMock} />);
    expect(screen.getByText(/protocolo teste/i)).toBeInTheDocument();
    expect(screen.getByText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/copiar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/baixar/i)).toBeInTheDocument();
  });

  it('duplica protocolo com sucesso', async () => {
    render(<HistoricoProtocolos onEditProtocol={onEditProtocolMock} />);
    fireEvent.click(screen.getByLabelText(/copiar/i));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/protocolo duplicado/i) })
      );
      expect(refetchMock).toHaveBeenCalled();
    });
  });

  it('exibe toast de erro ao duplicar', async () => {
    // O jest.mock global já cobre supabase.from, mas para testar o caso de erro específico
    // precisamos de um spy no mock já existente.
    jest.spyOn(supabaseClientMock, 'from').mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: { message: 'Erro ao duplicar' } })
    });
    render(<HistoricoProtocolos onEditProtocol={onEditProtocolMock} />);
    fireEvent.click(screen.getByLabelText(/copiar/i));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/erro ao duplicar/i), variant: 'destructive' })
      );
    });
  });

  it('exporta protocolo como PDF e exibe toast', () => {
    render(<HistoricoProtocolos onEditProtocol={onEditProtocolMock} />);
    fireEvent.click(screen.getByLabelText(/baixar/i));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/pdf exportado/i) })
    );
  });
});
