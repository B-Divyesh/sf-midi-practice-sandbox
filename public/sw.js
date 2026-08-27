const CACHE = 'midi-first-note-v2';
const PAGES = ['/', '/privacy/', '/terms/'];
const STATIC = ['/manifest.webmanifest', '/favicon.svg', '/fonts/silkscreen-latin-400-normal.woff2', '/assets/hero-signal-lab-768.webp'];

async function precacheShell() {
  const cache = await caches.open(CACHE);
  const resourceUrls = new Set(STATIC);
  await Promise.all(PAGES.map(async (path) => {
    const response = await fetch(path);
    if (!response.ok) return;
    await cache.put(path, response.clone());
    const html = await response.text();
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
      if (match[1]) resourceUrls.add(match[1]);
    }
  }));
  await Promise.all([...resourceUrls].map((url) => cache.add(url).catch(() => undefined)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('/') : undefined)))
  );
});
