const CACHE_NAME = 'seijo-mapping-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  if (location.hostname !== 'localhost') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    if (location.hostname === 'localhost') {
      await self.registration.unregister();
    }
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (location.hostname === 'localhost') return;
  if (event.request.url.includes('/api/') || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
