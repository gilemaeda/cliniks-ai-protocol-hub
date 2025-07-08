# Sistema de Preservação de Estado Entre Abas

Este documento descreve o sistema de preservação de estado entre abas implementado no Cliniks AI Protocol Hub. O sistema permite que o estado da aplicação seja preservado quando o usuário alterna entre abas ou recarrega a página, evitando perda de dados e melhorando a experiência do usuário.

## Componentes do Sistema

O sistema é composto por cinco componentes principais:

### 1. TabStateManager (Singleton)

Classe utilitária que gerencia a comunicação entre abas usando BroadcastChannel e localStorage. Cada aba recebe um identificador único para facilitar a comunicação.

**Arquivo:** `src/utils/TabStateManager.ts`

**Funcionalidades:**
- Geração de ID único para cada aba
- Comunicação entre abas usando BroadcastChannel
- Armazenamento persistente usando localStorage
- Sistema de eventos para notificação de mudanças de estado

### 2. useStatePreservation (Hook)

Hook React personalizado que preserva o estado entre recarregamentos de página e sincroniza entre abas.

**Arquivo:** `src/hooks/useStatePreservation.ts`

**Uso básico:**
```tsx
const [valor, setValor] = useStatePreservation<string>('chave_unica', 'valor_inicial');
```

**Opções avançadas:**
```tsx
const [valor, setValor] = useStatePreservation<string>(
  'chave_unica',
  'valor_inicial',
  {
    syncBetweenTabs: true,     // Sincronizar entre abas
    persistOnReload: true,     // Persistir em recarregamentos
    ttl: 3600,                 // Tempo de vida em segundos
    storage: 'localStorage'    // 'localStorage' ou 'sessionStorage'
  }
);
```

### 3. TabStateSync (Componente)

Componente React que sincroniza o estado entre abas, gerenciando eventos de visibilidade e foco.

**Arquivo:** `src/components/TabStateSync.tsx`

**Uso:**
```tsx
<TabStateSync>
  <App />
</TabStateSync>
```

### 4. Service Worker

Service worker registrado para interceptar requisições de recarregamento e preservar o estado da aplicação.

**Arquivo:** `public/service-worker.js`

**Funcionalidades:**
- Interceptação de requisições de recarregamento
- Cache de recursos estáticos
- Preservação de estado entre recarregamentos

### 5. FormPreservationTest (Componente de Teste)

Interface de teste que demonstra a preservação de estado entre abas, exibindo eventos de visibilidade e conexões entre abas.

**Arquivo:** `src/components/avaliacao-ia/FormPreservationTest.tsx`

**Acesso:** `/teste-preservacao` (apenas em ambiente de desenvolvimento)

## Como Usar

### 1. Preservar Estado em Componentes

Para preservar o estado de um componente entre recarregamentos e abas:

```tsx
import { useStatePreservation } from '@/hooks/useStatePreservation';

function MeuComponente() {
  // Estado básico com persistência
  const [nome, setNome] = useStatePreservation<string>('form_nome', '');
  
  // Estado com sincronização entre abas
  const [email, setEmail] = useStatePreservation<string>(
    'form_email',
    '',
    { syncBetweenTabs: true }
  );
  
  // Estado com tempo de vida limitado (1 hora)
  const [token, setToken] = useStatePreservation<string>(
    'auth_token',
    '',
    { ttl: 3600 }
  );
  
  return (
    <form>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
    </form>
  );
}
```

### 2. Escutar Eventos de Outras Abas

Para reagir a eventos de outras abas:

```tsx
import { useEffect } from 'react';
import tabStateManager from '@/utils/TabStateManager';

function MeuComponente() {
  useEffect(() => {
    const unsubscribe = tabStateManager.onMessage((message) => {
      if (message.type === 'STATE_UPDATE' && message.key === 'form_email') {
        console.log('Email atualizado em outra aba:', message.value);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return <div>...</div>;
}
```

### 3. Enviar Mensagens para Outras Abas

Para enviar mensagens para outras abas:

```tsx
import tabStateManager from '@/utils/TabStateManager';

function enviarMensagem() {
  tabStateManager.broadcast({
    type: 'CUSTOM_EVENT',
    data: { mensagem: 'Olá de outra aba!' }
  });
}
```

## Casos de Uso

### Formulários Longos

Ideal para formulários longos onde o usuário pode precisar alternar entre abas para consultar informações ou realizar outras tarefas.

### Autenticação

Manter o estado de autenticação sincronizado entre abas, evitando que o usuário precise fazer login novamente ao abrir uma nova aba.

### Carrinho de Compras

Sincronizar o carrinho de compras entre abas, permitindo que o usuário adicione produtos em uma aba e visualize o carrinho atualizado em outra.

## Considerações de Segurança

- **Dados Sensíveis:** Evite armazenar dados sensíveis usando este sistema, pois os dados são armazenados em localStorage/sessionStorage.
- **Tamanho dos Dados:** O localStorage tem um limite de aproximadamente 5MB por domínio. Evite armazenar grandes volumes de dados.
- **Limpeza de Dados:** Use a opção `ttl` para garantir que dados temporários sejam automaticamente removidos após um período.

## Testando o Sistema

Para testar o sistema de preservação de estado entre abas:

1. Acesse a rota `/teste-preservacao` em ambiente de desenvolvimento
2. Preencha os campos do formulário de teste
3. Abra uma nova aba com o mesmo formulário (use o botão "Abrir Nova Aba")
4. Alterne entre as abas e observe como o estado é preservado
5. Modifique valores em uma aba e veja as atualizações refletidas na outra

## Depuração

Para depurar problemas com a preservação de estado:

1. Verifique o console do navegador para mensagens de log
2. Inspecione o localStorage/sessionStorage no DevTools do navegador
3. Verifique se o Service Worker está ativo na aba Application do DevTools
4. Teste com diferentes navegadores para identificar problemas específicos

## Limitações Conhecidas

- O sistema depende de localStorage/sessionStorage, que pode ser bloqueado por configurações de privacidade do navegador
- Grandes volumes de dados podem causar problemas de desempenho
- A sincronização entre abas pode ter um pequeno atraso (geralmente imperceptível)
- O Service Worker pode não funcionar em todos os navegadores ou em modo de navegação privativa
