/* JCHAT Service Worker: offline support and runtime caching */
const CACHE_NAME = 'jchat-cache-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/Home.html',
  OFFLINE_URL,
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Other requests: cache-first with background refresh
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          // Cache successful GETs from same-origin and common CDNs
          try {
            if (
              response &&
              response.status === 200 &&
              request.method === 'GET' &&
              (request.url.startsWith(self.location.origin) ||
                /fonts|cdnjs|gstatic|cloudinary/.test(request.url))
            ) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
          } catch (_) {}
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});