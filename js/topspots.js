(function(){
  const map = L.map('map', { zoomControl: true }).setView([43.32, 16.45], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution:'© OpenStreetMap' }).addTo(map);

  // SVG-Icons als DivIcon
  function svgIcon(type) {
    const icons = {
      anchorage: '<img src="assets/icons/anchorage.svg" class="dot-svg" alt="">',
      harbor: '<img src="assets/icons/harbor.svg" class="dot-svg" alt="">',
      landmark: '<img src="assets/icons/landmark.svg" class="dot-svg" alt="">'
    };
    return L.divIcon({className:'', html: icons[type] || icons.anchorage, iconSize:[22,22]});
  }

  let allSpots = [];
  let markers = [];

  // Toast-Komponente
  function showToast(msg, retryFn) {
    const toast = document.getElementById('toast');
    toast.innerHTML = msg + (retryFn ? ' <button id="retry">Erneut laden</button>' : '');
    toast.hidden = false;
    if(retryFn) {
      document.getElementById('retry').onclick = function(){ toast.hidden = true; retryFn(); };
    }
  }
  function hideToast() {
    const toast = document.getElementById('toast');
    toast.hidden = true;
  }

  // Windy-Link aktualisieren
  function updateWindyLink() {
    const c = map.getCenter();
    const url = `https://www.windy.com/${c.lat.toFixed(6)}/${c.lng.toFixed(6)}?${new Date().toISOString().slice(0,10).replace(/-/g,'')},${c.lat.toFixed(6)},${c.lng.toFixed(6)},10`;
    const link = document.getElementById('windy-link');
    link.href = url;
  }
  map.on('moveend', updateWindyLink);
  updateWindyLink();

  // Marker entfernen
  function clearMarkers(){ markers.forEach(m=> map.removeLayer(m)); markers = []; }

  // Popup-HTML
  function popupHtml(s){
    return `<div class="popup">
      <h3>${s.name}</h3>
      <div class="badges">
        <span class="badge">${s.typeLabel}</span>
        <span class="badge badge-light">${s.bestLight}</span>
      </div>
      <div class="sec"><strong>Instagram:</strong><br>${s.instagram}</div>
      <div class="sec"><strong>Skipper-Tipps:</strong><br>${s.skipper}</div>
      <div class="sec coords">Koordinaten: <span style="font-family:monospace">${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}</span> <button class="copy" data-ll="${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}">kopieren</button></div>
    </div>`;
  }

  // Liste rendern
  function renderList(spots){
    const list = document.getElementById('spot-list');
    list.innerHTML = '';
    spots.forEach(s => {
      const li = document.createElement('li');
      li.tabIndex = 0;
      li.innerHTML = `<div class="name">${s.name}</div>
        <div class="meta">${s.typeLabel} · ${s.short}</div>
        <a class="more" href="spot.html?id=${encodeURIComponent(s.id)}">Mehr…</a>`;
      li.addEventListener('click', ()=>{
        const marker = markers.find(m => m.options.spotId === s.id);
        if(marker){ map.setView([s.lat, s.lng], 14); marker.openPopup(); }
      });
      li.addEventListener('keydown', e => {
        if(e.key==='Enter'){ li.click(); }
      });
      list.appendChild(li);
    });
  }

  // Marker rendern
  function renderMarkers(spots){
    clearMarkers();
    const group = [];
    spots.forEach(s => {
      const marker = L.marker([s.lat, s.lng], { icon: svgIcon(s.type), spotId: s.id }).bindPopup(popupHtml(s));
      marker.addTo(map);
      markers.push(marker);
      group.push([s.lat, s.lng]);
    });
    if(group.length){ map.fitBounds(L.latLngBounds(group).pad(0.12)); }
  }

  // Filter anwenden
  function applyFilters(){
    const query = (q.value || '').trim().toLowerCase();
    const allowed = new Set(checks.filter(c=>c.checked).map(c=>c.value));
    const filtered = allSpots.filter(s => allowed.has(s.type) && (
      !query || s.name.toLowerCase().includes(query) || (s.short||'').toLowerCase().includes(query)
    ));
    renderList(filtered);
    renderMarkers(filtered);
  }

  // Daten laden
  function loadSpots(){
    hideToast();
    fetch('content/map/topspots.json')
      .then(r => r.json())
      .then(data => {
        allSpots = Array.isArray(data) ? data : (data.spots || []);
        renderList(allSpots);
        renderMarkers(allSpots);
      })
      .catch(() => {
        showToast('Konnte Spots nicht laden. Prüfe content/map/topspots.json', loadSpots);
        allSpots = [];
        renderList([]);
        clearMarkers();
      });
  }

  // Suche/Filter
  const q = document.getElementById('q');
  const checks = Array.from(document.querySelectorAll('.chips input[type=checkbox]'));
  q.addEventListener('input', applyFilters);
  checks.forEach(c=> c.addEventListener('change', applyFilters));

  // Copy-Button
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.copy');
    if(!btn) return;
    const txt = btn.getAttribute('data-ll');
    navigator.clipboard.writeText(txt).then(()=>{
      btn.textContent = 'kopiert ✓';
      setTimeout(()=>btn.textContent='kopieren', 1200);
    });
  });

  loadSpots();
})();
