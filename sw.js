// CAISP Caderno de Campo - Service Worker v1.0
const CACHE_NAME = 'caisp-v1';
const URLS_TO_CACHE = [
  '/caderno-campo-caisp.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// INSTALL — cacheia o app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/caderno-campo-caisp.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ACTIVATE — limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH — serve do cache se offline
self.addEventListener('fetch', event => {
  // Não intercepta requisições ao Supabase (gerenciadas pelo app)
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('googleapis.com')) return;
  if (event.request.url.includes('jsdelivr.net')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/caderno-campo-caisp.html'));
    })
  );
});

// SYNC — recebe mensagem do app para sincronizar
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
