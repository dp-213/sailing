(() => {
  'use strict';

  const DATA_URL = new URL('content/map/topspots.json?v=2025-08-22-3', document.baseURI).toString();

  const mapEl    = document.getElementById('map');
  const listEl   = document.getElementById('spot-list');
  const searchEl = document.getElementById('q');
  const typeEls  = Array.from(document.querySelectorAll('.chips input[type="checkbox"]'));
  const windyLink= document.getElementById('windy-link');

  if (!mapEl || !listEl) {
    console.error('[TopSpots] Required DOM nodes missing (#map, #spot-list). Check topspots.html.');
    return;
  }

  // Counter (insert above list)
  let counterEl = document.getElementById('spot-counter');
  if (!counterEl) {
    counterEl = document.createElement('div');
    counterEl.id = 'spot-counter';
    counterEl.style.cssText = 'padding:.5rem 1rem;color:#374151;font-weight:600';
    counterEl.textContent = 'Spots: –';
    listEl.parentElement.insertBefore(counterEl, listEl);
  }

  // Map
  const map = L.map(mapEl, { zoomControl: true }).setView([43.32, 16.45], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '© OpenStreetMap'
  }).addTo(map);
  window.addEventListener('load', () => map.invalidateSize());

  // Default icon (Safari fix)
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  // Dot icons
  const iconDot = (cls) => L.divIcon({ className:'', html:`<span class="dot ${cls}"></span>`, iconSize:[12,12] });
  const icons = { anchorage: iconDot('dot-a'), harbor: iconDot('dot-h'), landmark: iconDot('dot-l') };

  let allSpots = [];
  const markers = [];
  const markerById = new Map();

  const validLatLng = (lat,lng) => Number.isFinite(lat) && Number.isFinite(lng) && lat>42.4 && lat<44.2 && lng>15.6 && lng<17.5;

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
        <div class="sec"><a class="btn" href="${deeplink}">Mehr …</a></div>
      </div>`;
  }

  function makeListItem(s) {
    const li = document.createElement('li');
    const meta = [s.typeLabel || s.type || '', s.short || ''].filter(Boolean).join(' · ');
    li.innerHTML = `
      <div class="name">${s.name || 'Unbenannter Spot'}</div>
      <div class="meta">${meta || '&nbsp;'}</div>
      <a href="spot.html?id=${encodeURIComponent(s.id)}" class="more">Mehr…</a>
    `;
    return li;
  }

  function clearMarkers(){ markers.forEach(m=>map.removeLayer(m)); markers.length=0; markerById.clear(); }

  function render(spots){
    clearMarkers(); listEl.innerHTML=''; counterEl.textContent = `Spots: ${spots.length}`;
    const bounds = [];
    spots.forEach(s=>{
      const lat=+s.lat, lng=+s.lng;
      if (!validLatLng(lat,lng)) { console.warn('[TopSpots] invalid coords', s.name, lat, lng); return; }
      const marker = L.marker([lat,lng], {icon: icons[s.type] || DefaultIcon}).bindPopup(popupHtml(s)).addTo(map);
      markers.push(marker); markerById.set(s.id, marker); bounds.push([lat,lng]);

      const li = makeListItem(s);
      li.addEventListener('click', (ev)=>{ if(ev.target.closest('.more')) return; map.setView([lat,lng],14); marker.openPopup(); });
      listEl.appendChild(li);
    });
    if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.12)); else map.setView([43.32,16.45],9);
  }

  function applyFilters(){
    const query=(searchEl?.value||'').trim().toLowerCase();
    const allowed=new Set(typeEls.filter(c=>c.checked).map(c=>c.value));
    const filtered=allSpots.filter(s=>allowed.has(s.type||'anchorage') && (!query
      || (s.name||'').toLowerCase().includes(query)
      || (s.short||'').toLowerCase().includes(query)
      || (s.island||'').toLowerCase().includes(query)
      || (s.typeLabel||s.type||'').toLowerCase().includes(query)));
    render(filtered);
    if(!filtered.length) console.warn('[TopSpots] No results for query:', query, 'allowed:', [...allowed]);
  }

  function updateWindy(){
    if(!windyLink) return;
    const c=map.getCenter();
    windyLink.href=`https://www.windy.com/${c.lat.toFixed(3)}/${c.lng.toFixed(3)}?2025082400,${c.lat.toFixed(3)},${c.lng.toFixed(3)},10`;
  }
  map.on('moveend', updateWindy); updateWindy();

  document.addEventListener('click', (e)=>{
    const btn=e.target.closest('.copy'); if(!btn||!btn.dataset.ll) return;
    navigator.clipboard?.writeText(btn.dataset.ll).then(()=>{ const o=btn.textContent; btn.textContent='kopiert ✓'; setTimeout(()=>btn.textContent=o||'kopieren',1100); });
  });

  (async function init(){
    try{
      const res=await fetch(DATA_URL, {cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw=await res.json();
      const spots=Array.isArray(raw)?raw: (raw&&Array.isArray(raw.spots)?raw.spots:[]);
      allSpots=(spots||[]).filter(s=>Number.isFinite(+s.lat)&&Number.isFinite(+s.lng)&&s.id&&s.name);
      typeEls.forEach(c=>c.checked=true);
      applyFilters();
      console.log('[TopSpots] loaded', allSpots.length, 'from', DATA_URL);
    }catch(err){
      console.error('[TopSpots] load error', err);
      listEl.innerHTML='<li style="padding:1rem;color:#b91c1c">Konnte Spots nicht laden. Prüfe content/map/topspots.json</li>';
    }
  })();

  searchEl?.addEventListener('input', applyFilters);
  typeEls.forEach(c=>c.addEventListener('change', applyFilters));
})();
