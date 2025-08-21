(function(){
  const map = L.map('map', { zoomControl: true }).setView([43.32, 16.45], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution:'© OpenStreetMap' }).addTo(map);

  const iconA = L.divIcon({className:'', html:'<span class="dot dot-a"></span>', iconSize:[12,12]});
  const iconH = L.divIcon({className:'', html:'<span class="dot dot-h"></span>', iconSize:[12,12]});
  const iconL = L.divIcon({className:'', html:'<span class="dot dot-l"></span>', iconSize:[12,12]});

  const markers = [];
  let allSpots = [];

  fetch('content/map/topspots.json')
    .then(r=>r.json())
    .then(data => { allSpots = data.spots || data; render(allSpots); })
    .catch(err => { console.error(err); alert('Konnte Spots nicht laden. Prüfe content/map/topspots.json'); });

  function iconFor(type){ return type==='harbor'?iconH : type==='landmark'?iconL : iconA; }

  function popupHtml(s){
    const ll = `${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}`;
    const best = s.bestLight ? `<span class="tag">Bestes Licht: ${s.bestLight}</span>` : '';
    return `<div class="popup">
      <h3>${s.name}</h3>
      <div class="meta">${s.typeLabel || ''} ${best}</div>
      <div class="sec"><strong>Instagram-Moment:</strong><br>${s.insta}</div>
      <div class="sec"><strong>Skipper-Tipps:</strong><br>${s.skipper}</div>
      <div class="sec coords">Koordinaten: ${ll} <button class="copy" data-ll="${ll}">kopieren</button></div>
    </div>`;
  }

  function clearMarkers(){ markers.forEach(m=> map.removeLayer(m)); markers.length = 0; }

  function render(spots){
    clearMarkers();
    const list = document.getElementById('spot-list'); list.innerHTML = '';
    const group = [];
    spots.forEach(s=>{
      const m = L.marker([s.lat, s.lng], { icon: iconFor(s.type) }).bindPopup(popupHtml(s));
      m.addTo(map); markers.push(m); group.push([s.lat, s.lng]);
      const li = document.createElement('li');
      li.innerHTML = `<div class="name">${s.name}</div><div class="meta">${s.typeLabel || ''} · ${s.short || ''}</div>`;
      li.addEventListener('click', ()=>{ map.setView([s.lat, s.lng], 14); m.openPopup(); });
      list.appendChild(li);
    });
    if(group.length){ map.fitBounds(L.latLngBounds(group).pad(0.12)); }
  }

  const q = document.getElementById('q');
  const checks = Array.from(document.querySelectorAll('.chips input[type=checkbox]'));
  function applyFilters(){
    const query = (q.value || '').trim().toLowerCase();
    const allowed = new Set(checks.filter(c=>c.checked).map(c=>c.value));
    const filtered = allSpots.filter(s => allowed.has(s.type) && (
      !query || s.name.toLowerCase().includes(query) || (s.short||'').toLowerCase().includes(query)
    ));
    render(filtered);
  }
  q.addEventListener('input', applyFilters);
  checks.forEach(c=> c.addEventListener('change', applyFilters));

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.copy'); if(!btn) return;
    const txt = btn.getAttribute('data-ll');
    navigator.clipboard.writeText(txt).then(()=>{ btn.textContent = 'kopiert ✓'; setTimeout(()=>btn.textContent='kopieren', 1200); });
  });
})();
