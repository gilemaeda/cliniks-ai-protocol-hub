// Service Worker para Cliniks AI Protocol Hub
const CACHE_NAME = 'cliniks-ai-cache-v1';
const STATE_CACHE = 'cliniks-state-v1';
const STATE_PRESERVATION_TIME = 5 * 60 * 1000; // 5 minutos

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/manifest.json',
  '/favicon.ico'
];

// Função para verificar se uma URL é válida para cache
function isValidUrl(url) {
  // Verificar se a URL é http ou https (evitar chrome-extension:// e outros)
  return url && (url.startsWith('http:') || url.startsWith('https:'));
}

// Instalação do service worker e cache de recursos
self.addEventListener('install', (event) => {
  // Força a ativação imediata do service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Erro ao criar cache inicial:', error);
      })
  );
});

// Estratégia de cache: stale-while-revalidate para melhor performance
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não HTTP/HTTPS
  if (!isValidUrl(event.request.url)) {
    return;
  }
  
  // Ignorar requisições não GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Só armazena em cache se for uma resposta válida
            if (networkResponse && networkResponse.status === 200 && isValidUrl(event.request.url)) {
              try {
                cache.put(event.request, networkResponse.clone());
              } catch (error) {
                console.warn('Erro ao armazenar em cache:', error);
              }
            }
            return networkResponse;
          })
          .catch(error => {
            console.warn('Erro de rede, usando cache:', error);
            return cachedResponse;
          });

        // Retorna o cache imediatamente se disponível, mas atualiza em segundo plano
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  // Toma controle de clientes não controlados (páginas abertas)
  event.waitUntil(clients.claim());
  
  // Limpa caches antigos
  const cacheWhitelist = [CACHE_NAME, STATE_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Receber mensagens do cliente para preservação de estado
self.addEventListener('message', async (event) => {
  const message = event.data;
  
  if (!message || !message.type) return;
  
  switch (message.type) {
    case 'PRESERVE_STATE':
      // Preservar estado da aplicação
      try {
        // Adiciona uma verificação para garantir que a mensagem de estado é válida
        if (!message.state || !message.state.url) {
          console.warn('[Service Worker] Mensagem PRESERVE_STATE inválida recebida. Ignorando.');
          return;
        }

        const stateCache = await caches.open(STATE_CACHE);
        const url = new URL(message.state.url);
        
        // Cria uma URL válida para ser usada como chave do cache
        const cacheKey = new URL(`/__state__${url.pathname}`, self.location.origin);

        // Armazenar estado no cache usando a chave válida
        await stateCache.put(
          cacheKey,
          new Response(JSON.stringify({
            ...message.state,
            preservedBy: message.tabId,
            timestamp: Date.now()
          }))
        );
        
        console.log('[Service Worker] Estado preservado para:', url.pathname);
        
        // Confirmar para o cliente
        if (event.source) {
          event.source.postMessage({
            type: 'STATE_PRESERVED',
            tabId: message.tabId,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('[Service Worker] Erro ao preservar estado:', error);
      }
      break;
      
    case 'TAB_FOCUSED':
      // Aba ganhou foco, nada a fazer por enquanto
      break;
      
    case 'TAB_BLURRED':
      // Aba perdeu foco, nada a fazer por enquanto
      break;
  }
});