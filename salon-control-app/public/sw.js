// Service worker de CB Control: la app se instala, abre sin internet con lo último guardado y recibe los avisos de la
// campana en el celular aunque esté cerrada (Web Push; los manda el Worker cb-avisos, app-clientas/avisos).
// Solo guarda lo de este sitio y las letras de Google: Dexie Cloud, /api y lo demás van directo, sin pasar por aquí.
// ponytail: caché simple «red primero, si falla, lo guardado» (igual que la app de clientas); Workbox si hace falta más.
const CACHE = 'cb-control-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  const propio = url.origin === location.origin, letras = /(^|\.)(gstatic|googleapis)\.com$/.test(url.hostname);
  if (request.method !== 'GET' || url.pathname.includes('/api/') || !(propio || letras)) return;
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(request, copia)); }
        return res;
      })
      .catch(() => caches.match(request).then(r => r || (request.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});

// Aviso del Worker: { titulo, detalle, id }. El tag es el id del aviso: si la campana ya lo notificó, no se repite.
self.addEventListener('push', e => {
  let a = { titulo: 'CB Control', detalle: 'Hay un aviso nuevo en la campana.' };
  try { a = e.data.json(); } catch { /* sin datos: aviso genérico */ }
  e.waitUntil(self.registration.showNotification(a.titulo, {
    body: a.detalle || '', icon: 'icons/icon-192.png', badge: 'icons/insignia-96.png', tag: a.id || 'cb-avisos', renotify: true
  }));
});

// Tocar el aviso abre CB Control (o la trae al frente si ya estaba abierta)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(ventanas => ventanas.length ? ventanas[0].focus() : self.clients.openWindow('./#/hoy')));
});
