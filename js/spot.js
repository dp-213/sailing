(function(){
  'use strict';

  // --- Helpers --------------------------------------------------------------
  function getIdFromUrl(){
    const m = location.search.match(/id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function bolden(text){
    return (text||'').replace(/\b(Wind|Tiefe|Bojen?|Anker|Schutz|Warnung|Landleine|Seegras|Felsen|Schwimmer)\b/gi, '<strong>$1</strong>');
  }
  function formatParagraphs(text){
    return (text||'').split(/\r?\n/).filter(Boolean).map(p=>`<p>${p.trim()}</p>`).join('');
  }
  function windyUrl(lat,lng){
    const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
    return `https://www.windy.com/${lat.toFixed(6)}/${lng.toFixed(6)}?${d},${lat.toFixed(6)},${lng.toFixed(6)},10`;
  }
  function googleMapsUrl(lat,lng){
    return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  }

  // --- Renderers ------------------------------------------------------------
  function prevNextNav(spot, allSpots){
    const idx = allSpots.findIndex(s=>s.id===spot.id);
    let html = '';
    if(idx>0){ html += `<a href="spot.html?id=${encodeURIComponent(allSpots[idx-1].id)}">← ${allSpots[idx-1].name}</a>`; }
    html += `<a href="topspots.html">Zurück zur Liste</a>`;
    if(idx<allSpots.length-1){ html += `<a href="spot.html?id=${encodeURIComponent(allSpots[idx+1].id)}">${allSpots[idx+1].name} →</a>`; }
    return html;
  }

  function renderSpot(spot, allSpots){
    const el = document.getElementById('spot-article');
    const lat = +spot.lat, lng = +spot.lng;
    el.innerHTML = `
      <h1>${spot.name||'Unbenannter Spot'}</h1>
      <div class="badges">
        ${spot.typeLabel?`<span class="badge">${spot.typeLabel}</span>`:''}
        ${spot.bestLight?`<span class="badge badge-light">Bestes Licht: ${spot.bestLight}</span>`:''}
        ${spot.island?`<span class="badge">${spot.island}</span>`:''}
      </div>
      <div class="button-row">
        <a href="${googleMapsUrl(lat,lng)}" target="_blank" rel="noopener">In Google Maps</a>
        <a href="${windyUrl(lat,lng)}" target="_blank" rel="noopener">In Windy</a>
        <button class="copy" data-ll="${lat.toFixed(6)}, ${lng.toFixed(6)}">Koordinaten kopieren</button>
      </div>
      <section>
        <h2>Instagram-Moment</h2>
        ${formatParagraphs(spot.instagram)}
      </section>
      <section>
        <h2>Skipper-Tipps</h2>
        ${formatParagraphs(bolden(spot.skipper))}
      </section>
      <section>
        <h2>Galerie</h2>
        ${(spot.photos&&spot.photos.length)?`<div class="gallery">${spot.photos.map(p=>`<img src="${p.src}" alt="${p.alt||''}">`).join('')}</div>`:'<div class="placeholder">Keine Fotos hinterlegt.</div>'}
      </section>
      <nav class="button-row">
        ${prevNextNav(spot, allSpots)}
      </nav>
    `;
  }

  function renderMap(spot){
    const wrap = document.getElementById('spot-map');
    wrap.innerHTML = '<div id="mini-map" style="height:260px;width:100%"></div>';
    const map = L.map('mini-map', { zoomControl: false, attributionControl: false }).setView([+spot.lat, +spot.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
    });
    L.marker([+spot.lat, +spot.lng], { icon: DefaultIcon }).addTo(map);

    // Fix grey-map when initially hidden
    setTimeout(()=> map.invalidateSize(), 50);
  }

  // --- Events ---------------------------------------------------------------
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.copy');
    if(!btn) return;
    const txt = btn.getAttribute('data-ll');
    navigator.clipboard?.writeText(txt).then(()=>{
      const old = btn.textContent;
      btn.textContent = 'kopiert ✓';
      setTimeout(()=> btn.textContent = old || 'Koordinaten kopieren', 1200);
    });
  });

  // --- Data Load ------------------------------------------------------------
  function load(){
    const id = getIdFromUrl();
    if(!id){
      document.getElementById('spot-article').innerHTML = '<h1>Fehlende Spot-ID</h1><p>Die Seite wurde ohne ?id=… aufgerufen.</p><a href="topspots.html">Zurück zur Liste</a>';
      return;
    }

    // IMPORTANT: version matches the list page to avoid cache mismatch
    const dataUrl = new URL('content/map/topspots.json?v=2025-08-22-3', document.baseURI).toString();
    console.log('[Spot] fetching', dataUrl);

    fetch(dataUrl, { cache: 'no-store' })
      .then(async r => {
        if(!r.ok) throw new Error('HTTP '+r.status);
        const txt = await r.text();
        try{ return JSON.parse(txt); }
        catch(e){ throw new Error('Ungültiges JSON: '+e.message+' | Beginn: '+txt.slice(0,120)); }
      })
      .then(raw => {
        const spots = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.spots) ? raw.spots : []);
        if(!Array.isArray(spots)) throw new Error('JSON enthält kein Array (spots)');
        const spot = spots.find(s=>s && s.id===id);
        if(!spot){
          document.getElementById('spot-article').innerHTML = `<h1>Spot nicht gefunden</h1><p>Die ID „${id}” existiert nicht.</p><a href="topspots.html">Zurück zur Liste</a>`;
          return;
        }
        renderSpot(spot, spots);
        renderMap(spot);
      })
      .catch(err => {
        console.error('[Spot] load error', err);
        document.getElementById('spot-article').innerHTML = '<h1>Fehler beim Laden</h1><p>Konnte Daten nicht laden. Prüfe content/map/topspots.json.</p>';
      });
  }

  load();
})();
