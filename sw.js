const CACHE_NAME = 'sailing-v3';
const BASE_PATH = '/sailing';

// Assets zum Cachen (ohne JSON-Daten)
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
  `${BASE_PATH}/assets/icons/app-icon-192.png`,
  `${BASE_PATH}/assets/icons/app-icon-512.png`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Hilfsfunktionen
const putRuntime = async (req, res) => {
  try {
    const c = await caches.open(CACHE);
    await c.put(req, res);
  } catch {}
};

// Fetch-Strategie:
// - HTML/JSON: network-first (mit Cache-Fallback)
// - Assets (css/js/svg/png/...): cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nur Requests im eigenen Origin/Scope behandeln
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin || !url.pathname.startsWith(SCOPE)) return;

  const isAsset = /\.(css|js|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname);
  const isHTML  = req.mode === 'navigate' || url.pathname.endsWith('.html');
  const isJSON  = url.pathname.endsWith('.json');

  if (isAsset) {
    // Cache-first für Assets
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          // nur erfolgreiche Antworten cachen
          if (res && res.status === 200) putRuntime(req, res.clone());
          return res;
        }).catch(() => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  if (isHTML || isJSON) {
    // Network-first für Dokumente & Daten
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) putRuntime(req, res.clone());
        return res;
      }).catch(() =>
        caches.match(req).then(cached =>
          cached || caches.match(`${SCOPE}index.html`) || new Response('', { status: 503 })
        )
      )
    );
    return;
  }

  // Fallback: versuche Cache, sonst Netz; liefere immer eine Response
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).catch(() => new Response('', { status: 503 })))
  );
});