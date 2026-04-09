const CACHE_NAME = 'calculadora-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE).catch(() => {
        // Se falhar em cachear arquivos específicos, continuar mesmo assim
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache response válida
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Fallback para cache offline
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - aplicativo funcionando em modo offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Background sync para sincronizar dados quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-historico') {
    event.waitUntil(
      // Sincronizar histórico se implementar backend
      Promise.resolve()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><rect fill=%22%230ea5e9%22 width=%22192%22 height=%22192%22/><text x=%2296%22 y=%2296%22 font-size=%22100%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-weight=%22bold%22>🧮</text></svg>',
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 512 512%22><rect fill=%22%230ea5e9%22 width=%22512%22 height=%22512%22/><text x=%22256%22 y=%22256%22 font-size=%22300%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-weight=%22bold%22>🧮</text></svg>',
    tag: 'calculadora-notif',
    requireInteraction: false
  };

  if (event.data) {
    options.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification('Calculadora', options)
  );
});

// Periodic background sync (se suportado)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-check') {
      event.waitUntil(
        fetch('/').then(() => {
          // App atualizado
        }).catch(() => {
          // Offline
        })
      );
    }
  });
}
