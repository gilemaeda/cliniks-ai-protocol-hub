import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientForm from './PatientForm';
import { useAuth } from '@/hooks/auth/authContext';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: [{ clinic_id: 'clinic-1', professional_id: 'prof-1' }], error: null })),
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
    }))
  }
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, profile: { id: 'profile-1' } })
}));

const toastMock = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

describe('PatientForm', () => {
  it('renderiza o formulário de cadastro', () => {
    render(<PatientForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar paciente/i })).toBeInTheDocument();
  });

  it('valida preenchimento obrigatório', async () => {
    render(<PatientForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar paciente/i }));
    // O HTML5 impede submit se required não preenchido, então não há toast
    await waitFor(() => {
      expect(screen.getByLabelText(/nome completo/i)).toBeInvalid();
    });
  });

  it('submete com sucesso e chama onSuccess', async () => {
    const onSuccess = jest.fn();
    render(<PatientForm onSuccess={onSuccess} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Fulano Teste' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'fulano@teste.com' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar paciente/i }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('exibe toast de erro se não autenticado', async () => {
    (useAuth as jest.Mock).mockImplementation(() => ({ user: null, profile: null }));
    // toastMock já está definido no escopo do describe e mockado acima
    render(<PatientForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    const nameInput = screen.getByLabelText(/nome completo/i);
    fireEvent.change(nameInput, { target: { value: 'Fulano Teste' } });
    await waitFor(() => expect(nameInput).toHaveValue('Fulano Teste'));
    fireEvent.click(screen.getByRole('button', { name: /cadastrar paciente/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/erro de autenticação/i),
          variant: 'destructive'
        })
      );
    });
  });
});
