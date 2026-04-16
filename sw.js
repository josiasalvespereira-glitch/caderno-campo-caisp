// CAISP Caderno de Campo - Service Worker v2.0
const CACHE_NAME = 'caisp-v2';

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add('/caderno-campo-caisp.html').catch(() => {});
    })
  );
});

// ACTIVATE — limpa caches antigos e toma controle imediatamente
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// FETCH — network first, cache fallback
self.addEventListener('fetch', event => {
  // Não intercepta Supabase, CDNs, fonts
  const url = event.request.url;
  if (url.includes('supabase.co')) return;
  if (url.includes('googleapis.com')) return;
  if (url.includes('jsdelivr.net')) return;
  if (url.includes('gstatic.com')) return;
  if (!url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva cópia no cache se for válida
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve do cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/caderno-campo-caisp.html'));
      })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
