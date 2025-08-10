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
    const poly=L.geoJSON(route,{style:{color:'#0077b6',weight:3}}).addTo(map);
    map.fitBounds(poly.getBounds());
  }
  if(places){
    places.forEach(p=>{
      const m=L.marker([p.coords[0],p.coords[1]]).addTo(map);
      if(p.name) m.bindPopup(`<strong>${p.name}</strong>`);
    });
  }
}

init();
