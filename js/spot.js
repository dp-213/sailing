(function(){
  // Hilfsfunktionen
  function getIdFromUrl(){
    const m = location.search.match(/id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function bolden(text){
    // Fette wichtige Worte: Wind, Tiefe, Boje, Anker, Schutz, Warnung
    return text.replace(/\b(Wind|Tiefe|Bojen?|Anker|Schutz|Warnung|Landleine|Seegras|Felsen|Schwimmer)\b/gi, '<strong>$1</strong>');
  }
  function formatParagraphs(text){
    return text.split(/\n|\r|\r\n/).map(p=>`<p>${p.trim()}</p>`).join('');
  }
  function windyUrl(lat,lng){
    return `https://www.windy.com/${lat.toFixed(6)}/${lng.toFixed(6)}?${new Date().toISOString().slice(0,10).replace(/-/g,'')},${lat.toFixed(6)},${lng.toFixed(6)},10`;
  }
  function googleMapsUrl(lat,lng){
    return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  }

  // Render Spot
  function renderSpot(spot, allSpots){
    const el = document.getElementById('spot-article');
    el.innerHTML = `
      <h1>${spot.name}</h1>
      <div class="badges">
        <span class="badge">${spot.typeLabel}</span>
        <span class="badge badge-light">${spot.bestLight}</span>
      </div>
      <div class="button-row">
        <a href="${googleMapsUrl(spot.lat,spot.lng)}" target="_blank" rel="noopener">In Google Maps</a>
        <a href="${windyUrl(spot.lat,spot.lng)}" target="_blank" rel="noopener">In Windy</a>
        <button class="copy" data-ll="${spot.lat.toFixed(6)}, ${spot.lng.toFixed(6)}">Koordinaten kopieren</button>
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
        ${spot.photos && spot.photos.length ? `<div class="gallery">${spot.photos.map(p=>`<img src="${p.src}" alt="${p.alt}">`).join('')}</div>` : '<div class="placeholder">Keine Fotos hinterlegt.</div>'}
      </section>
      <nav class="button-row">
        ${prevNextNav(spot, allSpots)}
      </nav>
    `;
  }
  function prevNextNav(spot, allSpots){
    const idx = allSpots.findIndex(s=>s.id===spot.id);
    let html = '';
    if(idx>0){
      html += `<a href="spot.html?id=${encodeURIComponent(allSpots[idx-1].id)}">← ${allSpots[idx-1].name}</a>`;
    }
    html += `<a href="topspots.html">Zurück zur Liste</a>`;
    if(idx<allSpots.length-1){
      html += `<a href="spot.html?id=${encodeURIComponent(allSpots[idx+1].id)}">${allSpots[idx+1].name} →</a>`;
    }
    return html;
  }

  // Mini-Map
  function renderMap(spot){
    const mapEl = document.getElementById('spot-map');
    mapEl.innerHTML = '<div id="mini-map" style="height:260px;width:100%"></div>';
    const map = L.map('mini-map', { zoomControl: false, attributionControl: false }).setView([spot.lat, spot.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    L.marker([spot.lat, spot.lng]).addTo(map);
  }

  // Copy-Button
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.copy');
    if(!btn) return;
    const txt = btn.getAttribute('data-ll');
    navigator.clipboard.writeText(txt).then(()=>{
      btn.textContent = 'kopiert ✓';
      setTimeout(()=>btn.textContent='Koordinaten kopieren', 1200);
    });
  });

  // Daten laden
  function load(){
    const id = getIdFromUrl();
    fetch('content/map/topspots.json')
      .then(r=>r.json())
      .then(data => {
        const spots = Array.isArray(data) ? data : (data.spots || []);
        const spot = spots.find(s=>s.id===id);
        if(!spot){
          document.getElementById('spot-article').innerHTML = '<h1>Spot nicht gefunden</h1><p>Die angeforderte ID ist unbekannt.</p><a href="topspots.html">Zurück zur Liste</a>';
          return;
        }
        renderSpot(spot, spots);
        renderMap(spot);
      })
      .catch(()=>{
        document.getElementById('spot-article').innerHTML = '<h1>Fehler beim Laden</h1><p>Konnte Daten nicht laden. Prüfe content/map/topspots.json.</p>';
      });
  }
  load();
})();
