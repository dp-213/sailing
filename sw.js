const CACHE_NAME = 'sailing-v1';
const BASE_PATH = '/sailing';

// Assets zum Cachen
const ASSETS = [
  // HTML
  `${BASE_PATH}/topspots.html`,
  `${BASE_PATH}/spot.html`,
  
  // CSS
  `${BASE_PATH}/css/topspots.css`,
  
  // JavaScript
  `${BASE_PATH}/js/topspots.js`,
  `${BASE_PATH}/js/spot.js`,
  
  // Daten
  `${BASE_PATH}/content/map/topspots.json`,
  
  // Icons
  `${BASE_PATH}/assets/icons/anchorage.svg`,
  `${BASE_PATH}/assets/icons/harbor.svg`,
  `${BASE_PATH}/assets/icons/landmark.svg`,
  `${BASE_PATH}/assets/icons/app-icon-192.png`,
  `${BASE_PATH}/assets/icons/app-icon-512.png`,
  
  // CDN-Ressourcen
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
