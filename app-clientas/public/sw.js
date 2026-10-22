// Service worker de la app de clientas: guarda la app para que abra sin internet y la
// actualiza en segundo plano. Las llamadas a la API (cuando exista) nunca se guardan.
// ponytail: caché simple «red primero, si falla, lo guardado»; Workbox si un día hace falta más control.
const CACHE = 'cb-clientas-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.pathname.includes('/api/')) return;
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(request, copia));
        }
        return res;
      })
      .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
  );
});
