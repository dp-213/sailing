const CACHE_NAME = 'sailing-v1';
const BASE_PATH = '/sailing';

// Assets die beim Install gecached werden
const ASSETS = [
  // HTML
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/topspots.html`,
  `${BASE_PATH}/spot.html`,
  
  // CSS
  `${BASE_PATH}/css/topspots.css`,
  
  // JavaScript
  `${BASE_PATH}/js/topspots.js`,
  `${BASE_PATH}/js/spot.js`,
  
  // Icons
  `${BASE_PATH}/assets/icons/anchorage.svg`,
  `${BASE_PATH}/assets/icons/harbor.svg`,
  `${BASE_PATH}/assets/icons/landmark.svg`,
  
  // CDN
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// Installation: Cache alle wichtigen Assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell...');
        return cache.addAll(ASSETS);
      })
  );
});

// Aktivierung: Lösche alte Caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
});

// Fetch: Network-first für JSON, Cache-first für Assets
self.addEventListener('fetch', (event) => {
  // JSON immer vom Network laden
  if (event.request.url.endsWith('topspots.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response;
        })
        .catch(err => {
          console.error('[SW] JSON fetch failed:', err);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Für alle anderen Requests: Cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});
  );
});
