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
        const meta=document.createElement('p');
        meta.innerHTML=`<strong>Distanz:</strong> ${md.data.distance_nm} sm`;
        sec.appendChild(meta);
        const body=marked.parse(md.body);
        const div=document.createElement('div');
        div.innerHTML=body;
        sec.appendChild(div);
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

// CREW
async function renderCrew() {
  const crew = await fetchYAML('content/crew/crew.yaml');
  if (!crew || !crew.members || !crew.members.length) return;
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'crew';
  const h = document.createElement('h2');
  h.textContent = 'Crew';
  section.appendChild(h);
  const grid = document.createElement('div');
  grid.style.display = 'flex';
  grid.style.flexWrap = 'wrap';
  grid.style.gap = '2rem';
  crew.members.forEach(member => {
    const card = document.createElement('div');
    card.style.flex = '1 1 180px';
    card.style.background = '#f7fafd';
    card.style.borderRadius = '10px';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
    card.style.padding = '1rem';
    card.style.textAlign = 'center';
    if (member.photo_url) {
      const img = document.createElement('img');
      img.src = member.photo_url;
      img.alt = member.name;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      img.style.marginBottom = '0.5rem';
      card.appendChild(img);
    }
    const name = document.createElement('div');
    name.textContent = member.name;
    name.style.fontWeight = 'bold';
    card.appendChild(name);
    const role = document.createElement('div');
    role.textContent = member.role;
    role.style.color = '#0077b6';
    card.appendChild(role);
    if (member.notes) {
      const notes = document.createElement('div');
      notes.textContent = member.notes;
      notes.style.fontSize = '0.95em';
      notes.style.marginTop = '0.5em';
      card.appendChild(notes);
    }
    grid.appendChild(card);
  });
  section.appendChild(grid);
  document.body.insertBefore(section, document.getElementById('map'));
}
window.renderCrew = renderCrew;

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
