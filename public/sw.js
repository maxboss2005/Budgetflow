const CACHE_NAME = 'budgetflow-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/manifest.json'
];

// Install Service Worker and cache essential static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static web asset shell.');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Some assets failed to pre-cache on install.', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate SW and purge legacy cache names
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing stale static cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass service worker interception for all local API calls and backend insights proxying
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Dynamic fetching for newer page bundle files
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache newly fetched assets on the fly for complete offline coverage
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Do not cache Chrome extensions or third party CDNs unless safe
          if (url.origin === self.location.origin) {
            cache.put(request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Fallback to offline index page
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
