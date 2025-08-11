(() => {
  'use strict';

  /**
   * Manual route renderer for Google Maps.  This implementation does not rely
   * on DirectionsService, because driving directions are not available across
   * open water.  Instead, it connects the given waypoints with straight
   * geodesic lines and renders interactive markers and a synchronized sidebar.
   */

  // ----- Configuration -----
  // Define each stop along the route.  Each stop has an id (letter),
  // human‑readable title, optional infoHtml, and latitude/longitude.  The
  // first and last stops should be the same when plotting a round trip.
  const STOPS = [
    { id:'A', title:'Split (Marina Zenta)',  infoHtml:'Start: Check‑in & Briefing', lat:43.4980, lng:16.4570 },
    { id:'B', title:'Blaue Lagune (Krknjaši)', infoHtml:'Badestopp: Sand/Seegras (3–6 m)', lat:43.4546, lng:16.1582 },
    { id:'C', title:'Trogir (UNESCO Altstadt)', infoHtml:'UNESCO‑Altstadt, Don Dino / TRS', lat:43.5169, lng:16.2514 },
    { id:'D', title:'Šešula (Šolta)', infoHtml:'Bojen‑Dinner Šišmiš; gut geschützt', lat:43.3934, lng:16.2093 },
    { id:'E', title:'Palmižana (Pakleni)', infoHtml:'Bojen/ACI; Zori Timeless/Laganini', lat:43.1606, lng:16.3716 },
    { id:'F', title:'Stari Grad (Hvar)', infoHtml:'Muring; Ager‑Runde mit Bikes', lat:43.1847, lng:16.5830 },
    { id:'G', title:'Lučice (Brač)', infoHtml:'Mehrarmige Traumbucht; Senko', lat:43.2920, lng:16.4700 },
    { id:'H', title:'Nečujam (Šolta)', infoHtml:'Große Bucht; Lunch/Badestopp', lat:43.3833, lng:16.3000 },
    { id:'I', title:'Split (Marina Zenta)',  infoHtml:'Rückkehr & Tanken', lat:43.4980, lng:16.4570 }
  ];

  // Default travel mode string used when building the external Google Maps
  // directions URL.  This has no effect on the polyline drawing itself.
  const DEFAULT_MODE = 'driving';

  // ----- State -----
  let map;                    // Google Map instance
  let infoWindow;             // Shared info window for all markers
  let polyline;               // Polyline connecting all stops
  const markers = [];         // Array of Google Maps Marker instances
  const els = {};             // Cache for DOM element references

  // Utility to select DOM elements
  const $ = sel => document.querySelector(sel);

  // Read travel mode from URL (?mode=walking|driving|bicycling|transit)
  function getModeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const normalized = (mode || '').toLowerCase();
    return ['walking','driving','bicycling','transit'].includes(normalized) ? normalized : DEFAULT_MODE;
  }

  // Build a shareable Google Maps directions URL with waypoints.  This uses
  // string coordinates instead of relying on DirectionsService for water
  // crossings.  Users can open the resulting URL in Google Maps.
  function buildExportLink(origin, waypoints, destination, mode) {
    const esc = encodeURIComponent;
    const toStr = s => `${s.lat},${s.lng}`;
    const wp = waypoints.map(toStr).map(esc).join('|');
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api','1');
    url.searchParams.set('origin', esc(toStr(origin)));
    url.searchParams.set('destination', esc(toStr(destination)));
    if (wp) url.searchParams.set('waypoints', wp);
    url.searchParams.set('travelmode', mode.toLowerCase());
    return url.toString();
  }

  // Remove all existing markers from the map
  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers.length = 0;
  }

  // Populate the sidebar list with stop entries and attach click/keyboard handlers
  function populateList(stops) {
    const list = els.list;
    list.innerHTML = '';
    stops.forEach((stop, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.setAttribute('tabindex','0');
      li.dataset.idx = idx.toString();
      li.innerHTML = `<strong>${stop.id}. ${stop.title}</strong>`;
      li.addEventListener('click', () => focusMarker(idx));
      li.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); focusMarker(idx); }
      });
      list.appendChild(li);
    });
  }

  // Focus the selected marker and open its info window
  function focusMarker(idx) {
    const marker = markers[idx];
    if (!marker) return;
    map.panTo(marker.getPosition());
    map.setZoom(Math.max(map.getZoom(), 12));
    google.maps.event.trigger(marker, 'click');
  }

  // Fit the map bounds to include all markers
  function fitBoundsToAll() {
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
  }

  // Draw the manual route by connecting all stops with a geodesic polyline,
  // creating markers and updating the export link
  function drawRoute(mode) {
    if (polyline) polyline.setMap(null);
    clearMarkers();
    const positions = STOPS.map(stop => new google.maps.LatLng(stop.lat, stop.lng));
    polyline = new google.maps.Polyline({
      path: positions,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.85,
      strokeWeight: 5
    });
    polyline.setMap(map);
    infoWindow = new google.maps.InfoWindow();
    STOPS.forEach((stop, i) => {
      const marker = new google.maps.Marker({
        position: positions[i],
        map,
        title: `${stop.id}. ${stop.title}`,
        icon: svgPin(stop.id)
      });
      marker.addListener('click', () => {
        infoWindow.setContent(
          `<div><strong>${stop.id}. ${stop.title}</strong><div>${stop.infoHtml || ''}</div></div>`
        );
        infoWindow.open(map, marker);
        const items = els.list.querySelectorAll('li');
        items.forEach(li => li.setAttribute('aria-selected', 'false'));
        const li = els.list.querySelector(`li[data-idx="${i}"]`);
        if (li) li.setAttribute('aria-selected', 'true');
      });
      markers.push(marker);
    });
    populateList(STOPS);
    fitBoundsToAll();
    els.export.href = buildExportLink(
      STOPS[0], STOPS.slice(1, -1), STOPS[STOPS.length - 1], mode
    );
  }

  // Generate a simple marker pin SVG encoded as a data URL.  Colour can be
  // customized via the optional colour parameter.
  function svgPin(letter, colour = '#2563eb') {
    return (
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" aria-hidden="true">\n` +
        `  <path fill="${colour}" d="M18 0c9.94 0 18 7.6 18 17 0 12.6-13.7 25.9-17.1 30a1.2 1.2 0 0 1-1.8 0C13.7 42.9 0 29.6 0 17 0 7.6 8.06 0 18 0z"/>\n` +
        `  <circle cx="18" cy="17" r="10" fill="white"/>\n` +
        `  <text x="18" y="22" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle" fill="${colour}" font-weight="700">${letter}</text>\n` +
        `</svg>`
      )
    );
  }

  // ----- Initialization -----
  window.initMap = function initMap() {
    els.map = document.getElementById('gmaps-map');
    els.list = document.getElementById('stops-list');
    els.mode = document.getElementById('mode');
    els.recalc = document.getElementById('btn-recalc');
    els.geoloc = document.getElementById('btn-geoloc');
    els.export = document.getElementById('export-link');
    els.error = document.getElementById('gmaps-error');
    const initialMode = getModeFromUrl();
    els.mode.value = initialMode.toUpperCase();
    map = new google.maps.Map(els.map, {
      center: { lat: 43.5, lng: 16.3 },
      zoom: 9,
      gestureHandling: 'greedy',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
    els.mode.addEventListener('change', () => {
      const mode = els.mode.value.toLowerCase();
      drawRoute(mode);
    });
    els.recalc.addEventListener('click', () => {
      const mode = els.mode.value.toLowerCase();
      drawRoute(mode);
    });
    els.geoloc.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation wird nicht unterstützt.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          STOPS[0] = { ...STOPS[0], lat: pos.coords.latitude, lng: pos.coords.longitude, title:'Meine Position', infoHtml:'Aktuelle Position' };
          STOPS.forEach((s, i) => { s.id = String.fromCharCode(65 + i); });
          const mode = els.mode.value.toLowerCase();
          drawRoute(mode);
        },
        () => alert('Geolocation fehlgeschlagen.')
      );
    });
    drawRoute(initialMode);
  };
})();
