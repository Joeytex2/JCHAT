/* JCHAT Service Worker: offline support, runtime caching, background sync, and push */
const CACHE_NAME = 'jchat-cache-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/Home.html',
  OFFLINE_URL,
  '/manifest.webmanifest'
];
const POST_SYNC_TAG = 'sync-post-queue-v1';

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

// Background sync for post queue (client stores queue in localStorage; SW triggers flush by message)
self.addEventListener('sync', (event) => {
  if (event.tag === POST_SYNC_TAG) {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'FLUSH_POST_QUEUE' }));
      })
    );
  }
});

// Push notifications (payload should be a JSON with title/body/icon/url)
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'JCHAT';
    const options = {
      body: data.body || '',
      icon: data.icon || 'https://placehold.co/192x192/1a1a2e/ffffff?text=J',
      badge: data.badge || undefined,
      data: { url: data.url || '/Home.html' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (_) {
    // Fallback simple notification
    event.waitUntil(self.registration.showNotification('JCHAT', { body: 'New notification' }));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/Home.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});