// Konstanten & Konfiguration
const DATA_URL = new URL('content/map/topspots.json?v=2025-08-22-3', document.baseURI).toString();
const FILTER_STORAGE_KEY = 'topspots-filters';

  // Keep in sync with list page; include fallbacks to avoid SW/cache/path issues
  const DATA_CANDIDATES = [
    new URL('content/map/topspots.json?v=2025-08-22-3', document.baseURI).toString(),
    new URL('/sailing/content/map/topspots.json?v=2025-08-22-3', location.origin).toString(),
    new URL('content/map/topspots.json', document.baseURI).toString(),
    new URL('/sailing/content/map/topspots.json', location.origin).toString()
  ];

  const $ = (sel) => document.querySelector(sel);
  const titleEl   = $('#title');
  const badgesEl  = $('#badges');
  const coordsEl  = $('#coords');
  const instaEl   = $('#insta');
  const skipperEl = $('#skipper');
  const gmapsEl   = $('#gmaps');
  const copyBtn   = $('#copy');

  if (!id) {
    titleEl.textContent = 'Fehlende Spot-ID';
    instaEl.textContent = 'Diese Seite wurde ohne gültige ID aufgerufen (Parameter ?id=...).';
    document.querySelector('.coords .btns')?.remove();
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
    }, { once: true });
  }

  async function fetchFirstWorking(urls) {
    const errors = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();
        let data;
        try {
          data = JSON.parse(txt);
        } catch (e) {
          throw new Error(`Ungültiges JSON: ${e.message}. Anfang: ${txt.slice(0, 120)}…`);
        }
        return { url, data };
      } catch (err) {
        errors.push(`${url} → ${err.message}`);
      }
    }
    throw new Error(errors.join('\n'));
  }

  function render(spot, allSpots) {
    titleEl.textContent = spot.name || 'Unbenannter Spot';
    badgesEl.innerHTML = '';
    if (spot.typeLabel) badgesEl.appendChild(makeBadge(spot.typeLabel));
    if (spot.bestLight) badgesEl.appendChild(makeBadge(`Bestes Licht: ${spot.bestLight}`));
    if (spot.island)    badgesEl.appendChild(makeBadge(spot.island));

    instaEl.textContent   = spot.instagram || spot.insta || '—';
    skipperEl.textContent = spot.skipper || '—';
    setCoords(spot.lat, spot.lng);

    // Map
    const map = L.map('detail-map', { zoomControl: true }).setView([+spot.lat, +spot.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
    });
    L.marker([+spot.lat, +spot.lng], { icon: DefaultIcon }).addTo(map);
    setTimeout(() => map.invalidateSize(), 60);
  }

  (async function init(){
    try {
      const { url, data } = await fetchFirstWorking(DATA_CANDIDATES);
      const spots = Array.isArray(data) ? data : (data && Array.isArray(data.spots) ? data.spots : []);
      if (!Array.isArray(spots)) throw new Error('JSON ohne gültiges Array ("spots").');
      const spot = spots.find(s => s && s.id === id);
      if (!spot) {
        titleEl.textContent = 'Spot nicht gefunden';
        instaEl.textContent = `Die ID „${id}” existiert nicht. Geladen von: ${url}`;
        const have = spots.map(s => s.id).filter(Boolean).slice(0, 20).join(', ');
        skipperEl.textContent = have ? `Bekannte IDs (Auszug): ${have} …` : 'Keine IDs gefunden.';
        document.querySelector('.coords .btns')?.remove();
        return;
      }
      render(spot, spots);
    } catch (err) {
      titleEl.textContent = 'Fehler beim Laden';
      instaEl.innerHTML = 'Konnte Daten nicht laden. Prüfe <code>content/map/topspots.json</code>.<br><small>'+ String(err.message).replace(/</g,'&lt;').replace(/\n/g,'<br>') +'</small>';
      console.error('[Spot] load error', err);
    }
  })();
})();
