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
  }

  // map
  const map = L.map('map').setView([43.45,16.35], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
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
