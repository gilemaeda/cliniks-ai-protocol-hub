import { renderHook, act } from '@testing-library/react';
import { useToast } from './use-toast';

describe('useToast', () => {
  it('deve adicionar um toast e removê-lo corretamente', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Teste', description: 'Mensagem de teste', variant: 'default' });
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Teste');

    act(() => {
      result.current.dismiss(result.current.toasts[0].id);
    });

    expect(result.current.toasts.length).toBe(0);
  });
});
