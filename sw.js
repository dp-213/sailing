const CACHE_NAME = 'sailing-v3';
const BASE_PATH = '/sailing';

// Assets zum Cachen
const PRECACHE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/topspots.html`,
  `${BASE_PATH}/spot.html`,
  `${BASE_PATH}/css/topspots.css`,
  `${BASE_PATH}/js/topspots.js`,
  `${BASE_PATH}/js/spot.js`,
  `${BASE_PATH}/content/map/topspots.json`,
  `${BASE_PATH}/assets/icons/anchorage.svg`,
  `${BASE_PATH}/assets/icons/harbor.svg`,
  `${BASE_PATH}/assets/icons/landmark.svg`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Spezialbehandlung für topspots.json
  if (url.pathname.includes('/content/map/topspots.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => new Response(JSON.stringify({ spots: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Standard-Assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache erfolgreiche Responses
            if (event.request.method === 'GET') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }

            return response;
          })
          .catch(() => {
            // Fallback für Offline
            return cached || new Response('Offline', { status: 503 });
          });
      })
  );
});