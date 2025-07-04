// Service Worker para Cliniks AI Protocol Hub
const CACHE_NAME = 'cliniks-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
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
  const cacheWhitelist = [CACHE_NAME];
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
