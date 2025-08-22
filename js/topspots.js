(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  // Use the same JSON + version as the list page to avoid cache mismatch
  const DATA_URL = new URL('content/map/topspots.json?v=2025-08-22-3', document.baseURI).toString();

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
    instaEl.textContent = 'Diese Seite wurde ohne gültige ID aufgerufen (Parameter ?id=...).';
    $('.coords .btns')?.remove();
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

  async function load() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${DATA_URL}`);
      // Be defensive: some SW/proxies mislabel content-type
      const txt = await res.text();
      let raw;
      try {
        raw = JSON.parse(txt);
      } catch (e) {
        throw new Error(`Ungültiges JSON (${e.message}). Antwortbeginn: ${txt.slice(0, 120)}…`);
      }

      const spots = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.spots) ? raw.spots : []);
      if (!Array.isArray(spots)) {
        throw new Error('JSON ohne gültiges Array ("spots").');
      }

      const spot = spots.find(s => s && s.id === id);
      if (!spot) {
        titleEl.textContent = 'Spot nicht gefunden';
        instaEl.textContent = `Die ID „${id}” existiert nicht in der Datenquelle (${DATA_URL}).`;
        const have = spots.map(s => s.id).filter(Boolean).slice(0, 15).join(', ');
        skipperEl.textContent = have ? `Bekannte IDs (Auszug): ${have} …` : 'Keine IDs gefunden.';
        $('.coords .btns')?.remove();
        return;
      }

      // Set content
      titleEl.textContent = spot.name || 'Unbenannter Spot';
      badgesEl.innerHTML = '';
      if (spot.typeLabel) badgesEl.appendChild(makeBadge(spot.typeLabel));
      if (spot.bestLight) badgesEl.appendChild(makeBadge(`Bestes Licht: ${spot.bestLight}`));
      if (spot.island) badgesEl.appendChild(makeBadge(spot.island));

      instaEl.textContent = spot.instagram || spot.insta || '—';
      skipperEl.textContent = spot.skipper || '—';
      setCoords(spot.lat, spot.lng);

      // Map
      const map = L.map('detail-map', { zoomControl: true }).setView([+spot.lat, +spot.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
      }).addTo(map);

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
