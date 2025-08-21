const CACHE_NAME = 'sailing-v2'; // Version erhöht für Clean Slate
const BASE_PATH = '/sailing';

// Vollständige Liste ALLER Assets
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
  
  // Data
  `${BASE_PATH}/content/map/topspots.json`,
  
  // Icons
  `${BASE_PATH}/assets/icons/anchorage.svg`,
  `${BASE_PATH}/assets/icons/harbor.svg`,
  `${BASE_PATH}/assets/icons/landmark.svg`,
  `${BASE_PATH}/assets/icons/app-icon-192.png`,
  `${BASE_PATH}/assets/icons/app-icon-512.png`,
  
  // CDN Resources
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// Cache beim Install
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching assets...');
        return cache.addAll(ASSETS);
      })
      .catch(err => console.error('[SW] Pre-cache failed:', err))
  );
});

// Alte Caches beim Activate löschen
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => {
          console.log('[SW] Removing old cache:', key);
          return caches.delete(key);
        })
    ))
  );
});

// Fetch-Handler mit Fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Versuche zuerst den Cache
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Sonst vom Netzwerk laden
        return fetch(event.request)
          .then(response => {
            // Cache nur erfolgreiche Responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('[SW] Caching new resource:', event.request.url);
                });
            }
            return response;
          })
          .catch(err => {
            console.error('[SW] Fetch failed:', err);
            // Wichtig: Leere 404-Response statt null zurückgeben
            return new Response('', {status: 404});
          });
      })
  );
});
});
