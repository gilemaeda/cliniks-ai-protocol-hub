import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProtocoloEditor from './ProtocoloEditor';
import { supabase as supabaseClientMock } from '@/integrations/supabase/client'; // Importar o mock

const toastMock = jest.fn();
const onBackMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null })
    })),
    rpc: jest.fn(() => Promise.resolve({ data: [{ clinic_id: 'clinic-1', name: 'Clínica Teste' }], error: null }))
  }
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

describe('ProtocoloEditor', () => {
  const protocolMock = {
    name: 'Protocolo Teste',
    description: 'Descrição',
    content: { generated_protocol: 'Conteúdo gerado' },
    therapeutic_objective: 'Objetivo',
    target_audience: 'Adultos',
    duration_weeks: 4,
    equipment_used: [],
    substances_used: []
  };

  beforeEach(() => {
    toastMock.mockClear();
    onBackMock.mockClear();
  });

  it('renderiza campos essenciais', () => {
    render(<ProtocoloEditor protocol={protocolMock} onBack={onBackMock} />);
    expect(screen.getByLabelText(/nome do protocolo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/objetivo terapêutico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/conteúdo do protocolo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar protocolo/i })).toBeInTheDocument();
  });

  it('submete protocolo com sucesso', async () => {
    render(<ProtocoloEditor protocol={protocolMock} onBack={onBackMock} />);

    // Esperar que fetchClinicData (que chama supabase.rpc) complete
    await waitFor(() => {
      expect(supabaseClientMock.rpc).toHaveBeenCalledWith('get_user_clinic_data', { user_uuid: 'user-1' });
    });

    fireEvent.change(screen.getByLabelText(/nome do protocolo/i), { target: { value: 'Protocolo Novo' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar protocolo/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/salvo com sucesso/i) })
      );
      expect(onBackMock).toHaveBeenCalled();
    });
  });

  it('exibe toast de erro ao salvar', async () => {
    (supabaseClientMock.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: { message: 'Erro ao salvar' } })
    });
    render(<ProtocoloEditor protocol={protocolMock} onBack={onBackMock} />);

    // Esperar que fetchClinicData (que chama supabase.rpc) complete
    await waitFor(() => {
      expect(supabaseClientMock.rpc).toHaveBeenCalledWith('get_user_clinic_data', { user_uuid: 'user-1' });
    });

    fireEvent.click(screen.getByRole('button', { name: /salvar protocolo/i }));

    await waitFor(() => {
      // Primeiro, verificar se foi chamado
      expect(toastMock).toHaveBeenCalled(); 
    });

    // Depois, verificar com quais argumentos foi chamado
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/erro ao salvar/i), variant: 'destructive' })
    );
  });
});
