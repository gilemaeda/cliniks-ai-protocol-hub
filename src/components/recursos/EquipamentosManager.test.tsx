import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EquipamentosManager from './EquipamentosManager';

const toastMock = jest.fn();
const refetchMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    })),
  }
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

jest.mock('@/hooks/useEquipmentsQuery', () => ({
  useEquipmentsQuery: () => ({ data: [], isLoading: false, error: null, refetch: refetchMock })
}));

jest.mock('./hooks/useCustomCategories', () => ({
  useCustomCategories: () => ({ customCategories: [], addCustomCategory: jest.fn(), removeCustomCategory: jest.fn() })
}));

describe('EquipamentosManager - Integração', () => {
  beforeEach(() => {
    toastMock.mockClear();
    refetchMock.mockClear();
  });

  it('renderiza botões principais', () => {
    render(<EquipamentosManager />);
    expect(screen.getByText(/novo equipamento/i)).toBeInTheDocument();
    expect(screen.getByText(/finalidade/i)).toBeInTheDocument();
  });

  it('exibe formulário ao clicar em "Novo Equipamento"', () => {
    render(<EquipamentosManager />);
    fireEvent.click(screen.getByText(/novo equipamento/i));
    expect(screen.getByLabelText(/nome do equipamento/i)).toBeInTheDocument();
  });

  it('valida nome obrigatório', async () => {
    render(<EquipamentosManager />);
    fireEvent.click(screen.getByText(/novo equipamento/i));
    fireEvent.change(screen.getByLabelText(/nome do equipamento/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText(/nome obrigatório/i)).toBeInTheDocument();
    });
  });

  it('submete novo equipamento com sucesso', async () => {
    render(<EquipamentosManager />);
    fireEvent.click(screen.getByText(/novo equipamento/i));
    fireEvent.change(screen.getByLabelText(/nome do equipamento/i), { target: { value: 'Novo Equipamento' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/sucesso/i) })
      );
      expect(refetchMock).toHaveBeenCalled();
    });
  });

  it('exibe toast de erro ao salvar', async () => {
    // Mock erro na inserção
    jest.spyOn(require('@/integrations/supabase/client').supabase, 'from').mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: { message: 'Erro ao salvar' } }),
      update: jest.fn(), delete: jest.fn(), eq: jest.fn(), select: jest.fn()
    });
    render(<EquipamentosManager />);
    fireEvent.click(screen.getByText(/novo equipamento/i));
    fireEvent.change(screen.getByLabelText(/nome do equipamento/i), { target: { value: 'Equipamento Erro' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/erro/i), variant: 'destructive' })
      );
    });
  });

  // O teste de exclusão pode ser expandido conforme a implementação do botão de deletar no ResourceCard
});
