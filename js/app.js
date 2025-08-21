// Fallback-Daten für Top-Spots, falls content/map/topspots.json (noch) nicht existiert
const DEFAULT_TOPSPOTS = [
  {
    name: "Blue Lagoon (Krknjaši), Drvenik Veli",
    coords: [43.441675, 16.176139],
    kind: "Mittagsstopp · Boje/Anker",
    popularity: "Sehr beliebt",
    instagram: "Karibik-Türkis über hellem Sand – Drohnenfoto zwischen Krknjaš Veli & Mali. Flachwasser, zerrissene Blautöne, weißer Saum.",
    tips: "Tagsüber an Sandflecken ankern/Boje; offen gegen N/O-Winde, am besten bei Maestral (NW) moderat. Hochsaison: früh da sein."
  },
  {
    name: "Vinogradišće Bay (Palmižana, Sv. Klement)",
    coords: [43.158000, 16.390280],
    kind: "Bucht · Bojenfeld",
    popularity: "Hotspot",
    instagram: "Pinienrahmen, smaragdgrüne Zunge, Beach-Clubs (Laganini & Co.) – goldenes Abendlicht auf Wassertaxis Richtung Hvar.",
    tips: "Guter Schutz bei N/NW, exponiert bei Jugo (S). Bojen statt Ankern. 10–15 Min Taxiboot nach Hvar."
  },
  {
    name: "Festung Fortica (Španjola) – Hvar Viewpoint",
    coords: [43.174870, 16.441860],
    kind: "Aussicht · Land",
    popularity: "Klassiker",
    instagram: "Ikonisches Hvar-Panorama über Altstadt & Pakleni-Inseln. Beste Shots Golden/Blue Hour – Stadtlichter + Ankerfeld.",
    tips: "Mit Taxiboot nach Hvar und Aufstieg zu Fuß. Kein Ankerplatz; Bildstopp an der Riva, Crew-Foto oben."
  },
  {
    name: "Uvala Lučice (Brač) – Restaurant & Bojen",
    coords: [43.310067, 16.446517],
    kind: "Bucht · Bojen/Restaurant",
    popularity: "Sehr beliebt",
    instagram: "Drei fingerförmige Becken, Kiefern & Kalkwände – vom SUP durchs kristallklare Becken zur Abendrunde.",
    tips: "Bojenfeld (Restaurant Lučice). Gut geschützt, bei starkem S etwas Schwell. Früh ankommen; Landleine möglich."
  },
  {
    name: "Uvala Šešula (Šolta) – Naturhafen bei Maslinica",
    coords: [43.392470, 16.210070],
    kind: "Bucht · Boje/Anker",
    popularity: "Beliebt",
    instagram: "Langgezogene Zackenbucht mit Glaswasser. Sunset-Silhouetten der sieben Inselchen vor Maslinica.",
    tips: "Sehr guter Wetterschutz; gerne Landleinen. Restaurants an Land per Dinghy erreichbar."
  },
  {
    name: "Maslinica (Šolta) – Marina & Schloss",
    coords: [43.398392, 16.207783],
    kind: "Hafen",
    popularity: "Beliebt",
    instagram: "Abendshot: Yachten unterm beleuchteten Schloss Martinis Marchi. Kopfsteinpflaster, Pastellhimmel.",
    tips: "Marina-Übernachtung komfortabel. Früh einlaufen; Alternativ Šešula (1 sm S), falls voll."
  },
  {
    name: "Uvala Smrka (Brač) – U-Boot-Tunnel",
    coords: [43.290200, 16.494300],
    kind: "Ankerbucht · Lost Place",
    popularity: "Geheimtipp+",
    instagram: "Dramatische Felskulisse + Ex-Militärtunnel. Kontrastreiche Fotos: dunkler Tunnel vs. türkisfarbene Außenbucht.",
    tips: "Guter Schutz außer bei S/Jugo; im NE-Teil auf Unterwasserfelsen achten. Auf Sand ankern; Landleinen empfohlen."
  },
  {
    name: "Zlatni Rat (Bol, Brač) – ‚Goldenes Horn‘",
    coords: [43.255831, 16.633800],
    kind: "Strand · Fotostopp",
    popularity: "Sehr beliebt",
    instagram: "Luftaufnahmen/Tele: die wandernde Kieszunge in Pfeilform. Klarstes Türkis mit Brandungsspitze.",
    tips: "Zum Baden top, aber offener Schwell möglich. Für ruhigen Fotoanker weiträumig frei halten; Drohne nur wo erlaubt."
  },
  {
    name: "Stiniva (Vis) – Schluchtbucht",
    coords: [43.021343, 16.171737],
    kind: "Tagesanker · Natur",
    popularity: "Sehr beliebt",
    instagram: "Der Klassiker: enger Felsdurchlass, innen Amphitheater-Strand. Spektakulär aus dem Dinghy.",
    tips: "Nur bei ruhigem Wetter! Draußen ankern und mit Dinghy durch die Öffnung. Kein Übernachtungsplatz; viel Verkehr mittags."
  },
  {
    name: "Zelena špilja (Grüne Grotte), Ravnik",
    coords: [43.015329, 16.224360],
    kind: "Spot · Einfahrt per Boot",
    popularity: "Beliebt",
    instagram: "Sonnenstrahl durchs Dachloch – grün glühendes Wasser. Gegen Mittag hellstes Licht.",
    tips: "Ein-/Ausfahrt organisiert; Regeln/Eintritt beachten. Nicht bei Seegang. Kurzanker draußen oder treiben lassen."
  },
  {
    name: "Uvala Tatinja (Šolta) – helle Sandflecken",
    coords: [43.369450, 16.283217],
    kind: "Ankerbucht · Mittagsstopp",
    popularity: "Local-Liebling",
    instagram: "Hufeisenbucht, Sandflecken im Türkis – perfekte Mittagsfarben. Felsige Kanten geben Kontrast.",
    tips: "Sand/Seegras – sauber auf Sand fallen lassen. Am ruhigsten bei W-Sektor; bei N/NE offen."
  }
];

async function fetchYAML(url){
  try{
    const res=await fetch(url);
    if(!res.ok) throw new Error('fetch failed');
    const text=await res.text();
    return jsyaml.load(text);
  }catch(e){
    console.warn('YAML load failed',url,e);
    return null;
  }
}

async function fetchMarkdown(url){
  try{
    const res=await fetch(url);
    if(!res.ok) throw new Error('fetch failed');
    const text=await res.text();
    const match=text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
    if(match){
      return {data: jsyaml.load(match[1]), body: match[2]};
    }
    return {data:{}, body:text};
  }catch(e){
    console.warn('MD load failed',url,e);
    return null;
  }
}

function renderCountdown(startIso){
  const start=new Date(startIso);
  const now=new Date();
  const diff=start-now;
  if(diff>0){
    const days=Math.floor(diff/86400000);
    document.getElementById('countdown').textContent=`Start in ${days} Tagen`;
  }
}

function createTopSpotPopup(p){
  const lat = Number(p.coords[0]);
  const lon = Number(p.coords[1]);
  const fmt = (n)=> (typeof n === 'number' ? n.toFixed(6) : n);
  return `
    <div style="max-width:320px">
      <h3 style="margin:.25rem 0 .5rem; font-size:1.05rem;">${p.name}</h3>
      <div style="margin:.35rem 0 .2rem; font-weight:600; text-transform:uppercase; font-size:.78rem; color:#6b7280;">Instagram</div>
      <div>${p.instagram || ''}</div>
      <div style="margin:.6rem 0 .2rem; font-weight:600; text-transform:uppercase; font-size:.78rem; color:#6b7280;">Skipper Tipps</div>
      <div>${p.tips || ''}</div>
      <div style="margin-top:.5rem">
        <span style="display:inline-block;background:#eef2ff;color:#3730a3;padding:.1rem .4rem;border-radius:.375rem;font-size:.72rem;margin-right:.25rem;">${p.kind || ''}</span>
        <span style="display:inline-block;background:#ecfeff;color:#155e75;padding:.1rem .4rem;border-radius:.375rem;font-size:.72rem;margin-right:.25rem;">${p.popularity || ''}</span>
      </div>
      <div style="margin-top:.5rem;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem;">Koordinaten: ${fmt(lat)}, ${fmt(lon)}</div>
    </div>`;
}

async function setupTopSpotsLayer(map){
  // Daten laden (extern oder Fallback)
  let spots = null;
  try{
    const res = await fetch('content/map/topspots.json');
    if(res.ok){ spots = await res.json(); }
  }catch(e){ /* ignore */ }
  if(!spots || !Array.isArray(spots) || !spots.length){
    spots = DEFAULT_TOPSPOTS;
  }
  const layer = L.layerGroup();
  const markers = [];
  spots.forEach(p=>{
    const lat = Number(p.coords[0]);
    const lon = Number(p.coords[1]);
    const m = L.marker([lat, lon]);
    m.bindPopup(createTopSpotPopup(p), { maxWidth: 320 });
    layer.addLayer(m);
    markers.push({ m, p });
  });
  // global referenzieren, um togglen & filtern zu können
  window._topSpots = { layer, spots, markers };
}

function applyTopSpotsFilter(filters){
  if(!window._topSpots) return;
  const { layer, markers } = window._topSpots;
  layer.clearLayers();
  markers.forEach(({m,p})=>{
    const kindBase = (p.kind||'').split('·')[0].trim(); // "Bucht" | "Hafen" | "Aussicht"
    const passKind = !filters.kind.size || filters.kind.has(kindBase);
    const passPop  = !filters.pop.size  || filters.pop.has((p.popularity||'').trim());
    if(passKind && passPop){ layer.addLayer(m); }
  });
}

function buildTopSpotsControls(map){
  // UI-Box erzeugen, falls nicht vorhanden
  let box = document.querySelector('.map-controls');
  if(!box){
    box = document.createElement('div');
    box.className = 'map-controls';
    box.innerHTML = `
      <h4>Filter</h4>
      <div class="row" id="chips-kind"></div>
      <div class="row" id="chips-pop"></div>
      <div class="row" style="justify-content:space-between;margin-top:.35rem">
        <a id="windy-link" href="#" target="_blank">Windy öffnen</a>
        <a id="reset-filters" href="#">Reset</a>
      </div>
    `;
    document.body.appendChild(box);
  }
  const KINDS = ['Bucht','Hafen','Aussicht'];
  const POPS  = ['Sehr beliebt','Hotspot','Local-Liebling','Geheimtipp+'];
  const filters = { kind: new Set(), pop: new Set() };
  const mkChip = (label, set)=>{
    const el = document.createElement('span');
    el.className = 'chip';
    el.textContent = label;
    el.addEventListener('click', ()=>{
      if(set.has(label)) { set.delete(label); el.classList.remove('active'); }
      else { set.add(label); el.classList.add('active'); }
      applyTopSpotsFilter(filters);
    });
    return el;
  };
  const kindRow = box.querySelector('#chips-kind');
  const popRow  = box.querySelector('#chips-pop');
  kindRow.textContent = ''; popRow.textContent = '';
  KINDS.forEach(k=> kindRow.appendChild(mkChip(k, filters.kind)) );
  POPS.forEach(p=>  popRow.appendChild(mkChip(p, filters.pop))  );

  // Windy-Link dynamisch anhand Kartenmitte aktualisieren
  const windy = box.querySelector('#windy-link');
  const updateWindy = ()=>{
    const c = map.getCenter();
    const lat = c.lat.toFixed(3), lon = c.lng.toFixed(3);
    windy.href = `https://www.windy.com/${lat}/${lon}?2025082400,${lat},${lon},9`;
  };
  updateWindy();
  map.on('moveend', updateWindy);

  // Reset
  box.querySelector('#reset-filters').addEventListener('click', (e)=>{
    e.preventDefault();
    filters.kind.clear(); filters.pop.clear();
    box.querySelectorAll('.chip.active').forEach(ch=> ch.classList.remove('active'));
    applyTopSpotsFilter(filters);
  });
}

async function init(){
  const trip=await fetchYAML('content/trip/trip.yaml');
  if(trip){
    document.title=trip.title;
    document.getElementById('trip-title').textContent=trip.title;
    document.getElementById('trip-subtitle').textContent=trip.subtitle;
    renderCountdown(trip.start_iso);
  }

  const nav=document.getElementById('itinerary-nav');
  const container=document.getElementById('itinerary');
  if(trip && trip.days){
    renderTimeline(trip.days);
    for(const day of trip.days){
      const file=`content/itinerary/${String(day).padStart(2,'0')}-tag${day}.md`;
      const md=await fetchMarkdown(file);
      const link=document.createElement('a');
      link.href=`#tag${day}`;
      link.textContent=`Tag ${day}`;
      nav.appendChild(link);
      if(md){
        const sec=document.createElement('section');
        sec.id=`tag${day}`;
        sec.className='section';
        const h=document.createElement('h2');
        h.textContent=`Tag ${day} – ${md.data.title}`;
        sec.appendChild(h);
        const meta=document.createElement('div');
        meta.innerHTML = `
          <strong>Datum:</strong> ${md.data.date_label || ''}<br>
          <strong>Distanz:</strong> ${md.data.distance_nm} sm<br>
          <strong>Von:</strong> ${md.data.from_place_id || ''} <strong>→</strong> ${md.data.to_place_id || ''}<br>
          <strong>Stops:</strong> ${(md.data.stops_place_ids && md.data.stops_place_ids.length) ? md.data.stops_place_ids.join(', ') : 'keine'}<br>
          <strong>Ankerinfo:</strong> Tiefe ${md.data.anchor_info?.depth_m || '-'} m, Grund: ${md.data.anchor_info?.seabed || '-'}, Schutz: ${md.data.anchor_info?.protection_from || '-'}<br>
        `;
        meta.style.marginBottom = '1em';
        sec.appendChild(meta);
        if(md.data.images && md.data.images.length) {
          const img = document.createElement('img');
          img.src = md.data.images[0];
          img.alt = md.data.title;
          img.style.width = '100%';
          img.style.maxWidth = '500px';
          img.style.borderRadius = '8px';
          img.style.marginBottom = '1em';
          sec.appendChild(img);
        }
        const body=marked.parse(md.body);
        const div=document.createElement('div');
        div.innerHTML=body;
        sec.appendChild(div);
        // Skipper-Tipps und Crew-Erlebnis hervorheben
        if(md.body.includes('Skipper-Tipps:')) {
          const tips = document.createElement('div');
          tips.innerHTML = '<strong>Skipper-Tipps:</strong> ' + md.body.split('Skipper-Tipps:')[1].split('\n')[1];
          tips.style.background = '#e0f7fa';
          tips.style.padding = '0.7em 1em';
          tips.style.borderRadius = '6px';
          tips.style.margin = '1em 0';
          sec.appendChild(tips);
        }
        container.appendChild(sec);
      } else {
        link.classList.add('disabled');
      }
    }
    // Toggle-Link für Top spots in die Nav einfügen (vor den Tag-Links)
    if(nav){
      const topLink = document.createElement('a');
      topLink.href = '#top-spots';
      topLink.textContent = 'Top spots';
      topLink.style.fontWeight = '600';
      topLink.style.marginRight = '0.8em';
      topLink.addEventListener('click', (e)=>{
        e.preventDefault();
        if(!window._topSpots) return;
        const { layer, spots } = window._topSpots;
        const onMap = map.hasLayer(layer);
        if(onMap){
          map.removeLayer(layer);
          topLink.classList.remove('active');
        } else {
          layer.addTo(map);
          topLink.classList.add('active');
          try{
            const bounds = L.latLngBounds(spots.map(s=>[s.coords[0], s.coords[1]]));
            map.fitBounds(bounds.pad(0.15));
          }catch(_){ /* ignore */ }
        }
      });
      // Link ganz vorne platzieren
      nav.prepend(topLink);
    }
  }

  // map
  const map = L.map('map').setView([43.45,16.35], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  await setupTopSpotsLayer(map);
  buildTopSpotsControls(map);
  const route=await fetch('content/map/route.geojson').then(r=>r.json()).catch(()=>null);
  const places=await fetch('content/map/places.json').then(r=>r.json()).catch(()=>null);
  if(route){
    const poly=L.geoJSON(route,{
      style:{color:'#0077b6',weight:4,opacity:0.85},
      onEachFeature: function (feature, layer) {
        if(feature.properties && feature.properties.name){
          layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
        }
      }
    }).addTo(map);
    map.fitBounds(poly.getBounds());
    // Interaktive Route: Hover hebt hervor
    poly.on('mouseover', function(e){
      e.target.setStyle({color:'#023e8a',weight:7});
    });
    poly.on('mouseout', function(e){
      e.target.setStyle({color:'#0077b6',weight:4});
    });
  }
  if(places){
    places.forEach(p=>{
      const m=L.marker([p.coords[0],p.coords[1]]).addTo(map);
      if(p.name) m.bindPopup(`<strong>${p.name}</strong>`);
    });
  }

  // Optional: Standardmäßig Top-Spots nicht anzeigen; Nutzer klickt im Menü.
  // Wenn gewünscht, kann man hier layer standardmäßig aktivieren:
  // if(window._topSpots && window._topSpots.layer){ window._topSpots.layer.addTo(map); }

  renderGallery();
}

// GALLERY
async function renderGallery() {
  const gallery = await fetchYAML('content/gallery/gallery.yaml');
  const container = document.createElement('div');
  container.className = 'section';
  const h = document.createElement('h2');
  h.textContent = 'Galerie';
  container.appendChild(h);
  if (gallery && gallery.items && gallery.items.length) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
    grid.style.gap = '1.5rem';
    gallery.items.forEach(item => {
      const fig = document.createElement('figure');
      fig.style.margin = 0;
      fig.style.background = '#f7f7f7';
      fig.style.borderRadius = '8px';
      fig.style.overflow = 'hidden';
      fig.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = item.caption;
      img.style.width = '100%';
      img.style.display = 'block';
      img.style.aspectRatio = '3/2';
      const cap = document.createElement('figcaption');
      cap.innerHTML = `<strong>${item.caption}</strong><br><small>${item.credit}</small>`;
      cap.style.padding = '0.5rem 1rem 1rem 1rem';
      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);
    });
    container.appendChild(grid);
  } else {
    container.appendChild(document.createTextNode('Keine Bilder vorhanden.'));
  }
  document.body.appendChild(container);
}

function renderTimeline(days) {
  const nav = document.getElementById('itinerary-nav');
  nav.innerHTML = '';
  days.forEach((day, idx) => {
    const link = document.createElement('a');
    link.href = `#tag${day}`;
    link.textContent = `Tag ${day}`;
    link.style.position = 'relative';
    link.style.paddingLeft = '2.2em';
    link.style.marginRight = '0.5em';
    // Icon
    const icon = document.createElement('span');
    icon.textContent = '⛵';
    icon.style.position = 'absolute';
    icon.style.left = '0.2em';
    icon.style.top = '0.1em';
    link.prepend(icon);
    nav.appendChild(link);
    if (idx < days.length - 1) {
      const sep = document.createElement('span');
      sep.textContent = '→';
      sep.style.margin = '0 0.5em';
      nav.appendChild(sep);
    }
  });
}

init();
window.renderGallery = renderGallery;
