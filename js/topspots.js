<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Spot-Details – Sailing Dalmatia</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin>
  <link rel="stylesheet" href="css/topspots.css?v=2025-08-22-2" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="index.html">⛵︎ Sailing Dalmatia</a>
      <nav class="main-nav">
        <a href="index.html">Route</a>
        <a href="topspots.html">Top Spots</a>
      </nav>
    </div>
  </header>

  <main class="detail">
    <article id="spot" class="spot-detail">
      <h1 id="title">Lade Spot …</h1>
      <div class="badges" id="badges"></div>

      <section class="coords">
        <div><strong>Koordinaten:</strong> <span id="coords" class="mono">–</span></div>
        <div class="btns">
          <button id="copy" class="btn">Koordinaten kopieren</button>
          <a id="gmaps" class="btn" target="_blank" rel="noopener">In Google Maps öffnen</a>
          <a id="back" class="btn btn-secondary" href="topspots.html">Zurück zur Übersicht</a>
        </div>
      </section>

      <section class="sec">
        <h2>Für Instagram</h2>
        <p id="insta">–</p>
      </section>

      <section class="sec">
        <h2>Skipper Tipps</h2>
        <p id="skipper">–</p>
      </section>

      <section class="map-wrap" style="margin-top:16px">
        <div id="detail-map" class="map" aria-label="Karte zum Spot"></div>
      </section>
    </article>
  </main>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin></script>
  <script src="js/spot.js?v=2025-08-22-2" defer></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sailing/sw.js', { scope: '/sailing/' });
    }
  </script>
</body>
</html>
  
(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const DATA_URL = new URL('content/map/topspots.json?v=2025-08-22-2', document.baseURI).toString();

  const $ = (sel) => document.querySelector(sel);
  const titleEl = $('#title');
  const badgesEl = $('#badges');
  const coordsEl = $('#coords');
  const instaEl = $('#insta');
  const skipperEl = $('#skipper');
  const gmapsEl = $('#gmaps');
  const copyBtn = $('#copy');

  if (!id) {
    titleEl.textContent = 'Fehlende Spot-ID';
    instaEl.textContent = 'Diese Seite wurde ohne gültige ID aufgerufen.';
    skipperEl.textContent = '';
    $('.coords .btns').style.display = 'none';
    return;
  }

  function makeBadge(text) {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = text;
    return span;
  }

  function setCoords(lat, lng) {
    const ll = `${(+lat).toFixed(6)}, ${(+lng).toFixed(6)}`;
    coordsEl.textContent = ll;
    gmapsEl.href = `https://maps.google.com/?q=${ll}`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(ll).then(() => {
        copyBtn.textContent = 'kopiert ✓';
        setTimeout(() => copyBtn.textContent = 'Koordinaten kopieren', 1200);
      });
    });
  }

  async function load() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const spots = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.spots) ? raw.spots : []);
      const spot = spots.find(s => s.id === id);

      if (!spot) {
        titleEl.textContent = 'Spot nicht gefunden';
        instaEl.textContent = `Die ID „${id}” existiert nicht in der Datenquelle.`;
        $('.coords .btns').style.display = 'none';
        return;
      }

      // Content
      titleEl.textContent = spot.name || 'Unbenannter Spot';
      badgesEl.innerHTML = '';
      if (spot.typeLabel) badgesEl.appendChild(makeBadge(spot.typeLabel));
      if (spot.bestLight) badgesEl.appendChild(makeBadge(`Bestes Licht: ${spot.bestLight}`));
      if (spot.island) badgesEl.appendChild(makeBadge(spot.island));

      instaEl.textContent = spot.instagram || spot.insta || '—';
      skipperEl.textContent = spot.skipper || '—';
      setCoords(spot.lat, spot.lng);

      // Small map
      const map = L.map('detail-map', { zoomControl: true }).setView([+spot.lat, +spot.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);

      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
      });
      L.marker([+spot.lat, +spot.lng], { icon: DefaultIcon }).addTo(map);

    } catch (err) {
      titleEl.textContent = 'Fehler beim Laden';
      instaEl.textContent = 'Konnte Daten nicht laden. Prüfe content/map/topspots.json.';
      console.error('[Spot] load error', err);
    }
  }

  load();
})();

function popupHtml(s) {
  const ll = `${(+s.lat).toFixed(6)}, ${(+s.lng).toFixed(6)}`;
  const typeLabel = s.typeLabel || s.type || '';
  const best = s.bestLight ? ` · Bestes Licht: ${s.bestLight}` : '';
  const insta = s.instagram || s.insta || '—';
  const skip  = s.skipper || '—';
  const deeplink = `spot.html?id=${encodeURIComponent(s.id)}`;
  return `
    <div class="popup">
      <h3>${s.name || 'Unbenannter Spot'}</h3>
      <div class="meta">${typeLabel}${best}</div>
      <div class="sec"><strong>Für Instagram</strong><br>${insta}</div>
      <div class="sec"><strong>Skipper Tipps</strong><br>${skip}</div>
      <div class="sec coords">
        Koordinaten: <span class="mono">${ll}</span>
        <button class="copy" data-ll="${ll}">kopieren</button>
        <a class="copy" style="margin-left:.5rem" target="_blank" rel="noopener" href="https://maps.google.com/?q=${ll}">Google Maps</a>
      </div>
      <div class="sec">
        <a class="btn" href="${deeplink}">Mehr …</a>
      </div>
    </div>`;
}

/* Detail page helpers */
.spot-detail { padding: 16px; max-width: 960px; margin: 0 auto; }
.badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; }
.badge { background: var(--chip-bg, #eef2ff); color: var(--chip-fg, #374151); border: 1px solid #e5e7eb; border-radius: 999px; padding: 4px 10px; font-size: .85rem; }
.btn { display:inline-block; padding:.5rem .75rem; border:1px solid #e5e7eb; border-radius:8px; text-decoration:none; background:#fff; color:#111827 }
.btn:hover { background:#f9fafb }
.btn-secondary{ background:#f3f4f6 }
.detail .map{ height: 45vh }
@media (max-width:768px){ .detail .map{ height: 50vh } }
@media (max-width: 900px){
  .layout{grid-template-columns:1fr}
  .panel{order:2}
  .map-wrap{order:1}
  .map{height:52vh}
}
