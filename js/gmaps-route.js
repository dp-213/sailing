(() => {
  'use strict';

  
  // Configuration
  const STOPS = [
    { id:'A', title:'Split (Marina Zenta)',  infoHtml:'Start: Check-in & Briefing', query:'Marina Zenta, Split', lat:43.4980, lng:16.4570 },
    { id:'B', title:'Blaue Lagune (Krknja\u0161i)', infoHtml:'Badestopp: Sand/Seegras (3–6m)', query:'Blue Lagoon Krknjasi' },
    { id:'C', title:'Trogir (Altstadt/Marina)', infoHtml:'UNESCO Altstadt, Don Dino / TRS', query:'Trogir Old Town' },
    { id:'D', title:'\u0160e\u0161ula (\u0160olta)', infoHtml:'Bojen-Dinner \u0160i\u0161mi\u0161; sehr guter Schutz', query:'Sesula Bay Solta', lat:43.3934, lng:16.2093 },
    { id:'E', title:'Palmi\u017eana (Pakleni)', infoHtml:'Bojen/ACI; Zori Timeless/Laganini', query:'Palmizana' },
    { id:'F', title:'Stari Grad (Hvar)', infoHtml:'Muring, Ager-Runde mit Bikes', query:'Stari Grad Hvar' },
    { id:'G', title:'Luci\u0107e (Bra\u010d)', infoHtml:'Mehrarmige Traumbucht; Senko', query:'Lucice Bay Brac' },
    { id:'H', title:'Ne\u010dujam (\u0160olta)', infoHtml:'Gro\u00dfe Bucht; Lunch/Badestopp', query:'Necujam Solta' },
    { id:'I', title:'Split (Marina Zenta)',  infoHtml:'R\u00fcckkehr & Tanken', query:'Marina Zenta, Split', lat:43.4980, lng:16.4570 },
  ];
  const DEFAULT_MODE = 'DRIVING';

  let map, directionsService, directionsRenderer, infoWindow;
  const markers = [];
  const $ = s => document.querySelector(s);
  const els = {};

  const getModeFromUrl = () => {
    const m = new URLSearchParams(location.search).get('mode');
    const M = (m || '').toUpperCase();
    return ['DRIVING','WALKING','BICYCLING','TRANSIT'].includes(M) ? M : DEFAULT_MODE;
  };

  const svgPin = (letter, color='#2563eb') =>
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" aria-hidden="true">\n         <path fill="${color}" d="M18 0c9.94 0 18 7.6 18 17 0 12.6-13.7 25.9-17.1 30a1.2 1.2 0 0 1-1.8 0C13.7 42.9 0 29.6 0 17 0 7.6 8.06 0 18 0z"/>\n         <circle cx="18" cy="17" r="10" fill="white"/>\n         <text x="18" y="22" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle" fill="${color}" font-weight="700">${letter}</text>\n       </svg>`
    );

  const clearMarkers = () => { markers.forEach(m=>m.setMap(null)); markers.length = 0; };
  const focusMarker = (idx) => {
  
    const m = markers[idx]; if (!m) return;
    map.panTo(m.getPosition()); map.setZoom(Math.max(map.getZoom(), 12));
    google.maps.event.trigger(m, 'click');
  };

  const populateList = (stops) => {
    const list = els.list; list.innerHTML = '';
    stops.forEach((s, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.setAttribute('tabindex','0');
      li.dataset.idx = idx;
      li.innerHTML = `<strong>${s.id}. ${s.title}</strong>`;
      li.addEventListener('click', () => { focusMarker(idx); li.setAttribute('aria-selected','true'); });
      li.addEventListener('keydown', (ev) => {
        if (ev.key==='Enter'||ev.key===' ') { ev.preventDefault(); li.click(); }
      });
      list.appendChild(li);
    });
  };

  const fitBoundsToAll = () => {
    const b = new google.maps.LatLngBounds();
    markers.forEach(m => b.extend(m.getPosition()));
    map.fitBounds(b);
  };

  const buildExportLink = (origin, waypoints, destination, mode) => {
    const esc = encodeURIComponent;
    const toStr = s => s.query ? s.query : (s.lat && s.lng ? `${s.lat},${s.lng}` : s.title);
    const wp = waypoints.map(toStr).map(esc).join('|');
    const u = new URL('https://www.google.com/maps/dir/');
    u.searchParams.set('api','1');
    u.searchParams.set('origin', esc(toStr(origin)));
    u.searchParams.set('destination', esc(toStr(destination)));
    if (wp) u.searchParams.set('waypoints', wp);
    u.searchParams.set('travelmode', mode.toLowerCase());
    return u.toString();
  };

  async function routeAndRender(mode){
    els.error.hidden = true;
    clearMarkers();

    const origin = STOPS[0];
    const destination = STOPS[STOPS.length-1];
    const waypoints = STOPS.slice(1,-1).map(s => ({
      location: s.query ? s.query : new google.maps.LatLng(s.lat, s.lng),
      stopover: true
    }));

    directionsRenderer.setMap(map);
    directionsRenderer.setOptions({ suppressMarkers:true, preserveViewport:false });

    try {
      const res = await directionsService.route({
        origin: origin.query ? origin.query : {lat:origin.lat,lng:origin.lng},
        destination: destination.query ? destination.query : {lat:destination.lat,lng:destination.lng},
        waypoints,
        travelMode: google.maps.TravelMode[mode],
        optimizeWaypoints: false
      });

      directionsRenderer.setDirections(res);

      infoWindow = new google.maps.InfoWindow();
      const legs = res.routes[0].legs;
      const positions = [ legs[0].start_location, ...legs.map(l => l.end_location) ];

      STOPS.forEach((stop, i) => {
        const marker = new google.maps.Marker({
          position: positions[i],
          map, title: `${stop.id}. ${stop.title}`,
          icon: svgPin(stop.id)
        });
        marker.addListener('click', () => {
          infoWindow.setContent(`<div><strong>${stop.id}. ${stop.title}</strong><div>${stop.infoHtml||''}</div></div>`);
          infoWindow.open(map, marker);
          els.list.querySelectorAll('li').forEach(li=>li.setAttribute('aria-selected','false'));
          const li = els.list.querySelector(`li[data-idx="${i}"]`);
          if (li) li.setAttribute('aria-selected','true');
        });
        markers.push(marker);
      });

      populateList(STOPS);
      fitBoundsToAll();
      els.export.href = buildExportLink(origin, STOPS.slice(1,-1), destination, mode);

    } catch (err) {
      els.error.hidden = false;
      els.error.textContent = `Karte: Directions fehlgeschlagen – ${err && err.message ? err.message : 'Unbekannter Fehler'}.`;
    }
  }

  window.initMap = function initMap(){
    els.map   = document.getElementById('gmaps-map');
    els.list  = document.getElementById('stops-list');
    els.mode  = document.getElementById('mode');
    els.recalc= document.getElementById('btn-recalc');
    els.geoloc= document.getElementById('btn-geoloc');
    els.error = document.getElementById('gmaps-error');
    els.export= document.getElementById('export-link');

    const initialMode = getModeFromUrl();
    els.mode.value = initialMode;

    map = new google.maps.Map(els.map, {
      center:{lat:43.5,lng:16.3}, zoom:9,
      gestureHandling:'greedy', mapTypeControl:false,
      streetViewControl:false, fullscreenControl:false
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions:{ strokeColor:'#2563eb', strokeWeight:5, strokeOpacity:.85 }
    });

    els.mode.addEventListener('change', () => routeAndRender(els.mode.value));
    els.recalc.addEventListener('click', () => routeAndRender(els.mode.value));
    els.geoloc.addEventListener('click', () => {
      if (!navigator.geolocation) return alert('Geolocation wird nicht unterst\u00fctzt.');
      navigator.geolocation.getCurrentPosition(
        pos => {
          STOPS[0] = { id:'A', title:'Meine Position', infoHtml:'Aktuelle Position', lat:pos.coords.latitude, lng:pos.coords.longitude };
          STOPS.forEach((s,i)=> s.id = String.fromCharCode(65+i));
          routeAndRender(els.mode.value);
        },
        () => alert('Geolocation fehlgeschlagen.')
      );
    });

    routeAndRender(initialMode);
  };
})();
