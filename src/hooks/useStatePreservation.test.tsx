import { renderHook, act } from '@testing-library/react';
import { useStatePreservation } from './useStatePreservation';

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useStatePreservation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('deve inicializar com o valor padrão quando não há nada no localStorage', () => {
    const { result } = renderHook(() => useStatePreservation('test_key', 'valor_inicial'));
    
    expect(result.current[0]).toBe('valor_inicial');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test_key');
  });

  it('deve recuperar o valor do localStorage se existir', () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify('valor_salvo'));
    
    const { result } = renderHook(() => useStatePreservation('test_key', 'valor_inicial'));
    
    expect(result.current[0]).toBe('valor_salvo');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test_key');
  });

  it('deve atualizar o valor no localStorage quando o estado muda', () => {
    const { result } = renderHook(() => useStatePreservation('test_key', 'valor_inicial'));
    
    act(() => {
      result.current[1]('novo_valor');
    });
    
    expect(result.current[0]).toBe('novo_valor');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_key', JSON.stringify('novo_valor'));
  });

  it('deve lidar com objetos complexos', () => {
    const objetoInicial = { nome: 'Teste', idade: 30 };
    const { result } = renderHook(() => useStatePreservation('test_object', objetoInicial));
    
    expect(result.current[0]).toEqual(objetoInicial);
    
    const novoObjeto = { nome: 'Atualizado', idade: 31 };
    
    act(() => {
      result.current[1](novoObjeto);
    });
    
    expect(result.current[0]).toEqual(novoObjeto);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_object', JSON.stringify(novoObjeto));
  });

  it('deve lidar com arrays', () => {
    const arrayInicial = [1, 2, 3];
    const { result } = renderHook(() => useStatePreservation('test_array', arrayInicial));
    
    expect(result.current[0]).toEqual(arrayInicial);
    
    const novoArray = [4, 5, 6];
    
    act(() => {
      result.current[1](novoArray);
    });
    
    expect(result.current[0]).toEqual(novoArray);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_array', JSON.stringify(novoArray));
  });

  it('deve lidar com funções de atualização', () => {
    const { result } = renderHook(() => useStatePreservation('test_counter', 0));
    
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_counter', JSON.stringify(1));
  });

  it('deve persistir o estado entre renderizações', () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify('valor_persistido'));
    
    const { result, rerender } = renderHook(() => useStatePreservation('test_persist', 'valor_inicial'));
    
    expect(result.current[0]).toBe('valor_persistido');
    
    rerender();
    
    expect(result.current[0]).toBe('valor_persistido');
  });

  it('deve simular a preservação de estado entre alternância de abas', () => {
    // Primeiro renderiza o hook e define um valor
    const { result, unmount } = renderHook(() => useStatePreservation('test_tab_switch', 'valor_inicial'));
    
    act(() => {
      result.current[1]('valor_antes_de_alternar');
    });
    
    expect(result.current[0]).toBe('valor_antes_de_alternar');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_tab_switch', JSON.stringify('valor_antes_de_alternar'));
    
    // Desmonta o componente (simula sair da aba)
    unmount();
    
    // Remonta o componente (simula voltar para a aba)
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify('valor_antes_de_alternar'));
    const { result: newResult } = renderHook(() => useStatePreservation('test_tab_switch', 'valor_inicial'));
    
    // O valor deve ser preservado
    expect(newResult.current[0]).toBe('valor_antes_de_alternar');
  });
});
