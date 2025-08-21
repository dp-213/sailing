// DOM Elements
const spotList = document.getElementById('spot-list');
const searchInput = document.getElementById('q');
const typeFilters = document.querySelectorAll('.chips input[type="checkbox"]');
const windyLink = document.getElementById('windy-link');
const toastEl = document.getElementById('toast');

// Custom Icons für die Kartenmarker
const createIcon = (type) => {
  const svg = document.querySelector(`img[src="assets/icons/${type}.svg"]`).cloneNode();
  return L.divIcon({
    html: svg.outerHTML,
    className: `marker-${type}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Toast-Nachricht anzeigen
const showToast = (message, duration = 5000) => {
  toastEl.textContent = message;
  toastEl.hidden = false;
  setTimeout(() => toastEl.hidden = true, duration);
};

  // Formatiere Koordinaten für Copy-Button
const formatCoords = (lat, lng) => `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;

// Rendere Popup-Inhalt
const createPopup = (spot) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="min-width:280px">
      <h3 style="margin:0 0 .5rem">${spot.name}</h3>
      <div style="margin-bottom:.75rem">
        <span class="badge">${spot.typeLabel}</span>
        <span class="badge badge-light">${spot.bestLight}</span>
      </div>
      <div style="margin-bottom:.75rem">${spot.instagram}</div>
      <div style="color:#4b5563;font-size:.95rem">${spot.skipper}</div>
      <div class="button-row">
        <button class="copy" data-coords="${formatCoords(spot.lat, spot.lng)}">
          ${formatCoords(spot.lat, spot.lng)}
        </button>
        <a href="spot.html?id=${spot.id}" class="more">Details →</a>
      </div>
    </div>
  `;

  // Copy-Button Handler
  const copyBtn = div.querySelector('.copy');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(copyBtn.dataset.coords);
    copyBtn.textContent = 'Kopiert!';
    setTimeout(() => copyBtn.textContent = copyBtn.dataset.coords, 2000);
  });

  return div;
};

// Rendere Listenelement
const createListItem = (spot) => {
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="name">${spot.name}</div>
    <div class="meta">${spot.typeLabel}</div>
    <div class="meta">${spot.short}</div>
    <a href="spot.html?id=${spot.id}" class="more">Mehr…</a>
  `;
  return li;
};

// Filtere Spots basierend auf Suche und Typ-Filtern
const filterSpots = (spots, search, types) => {
  const searchLower = search.toLowerCase();
  return spots.filter(spot => {
    const matchesSearch = !search || 
      spot.name.toLowerCase().includes(searchLower) || 
      spot.short.toLowerCase().includes(searchLower);
    const matchesType = types.includes(spot.type);
    return matchesSearch && matchesType;
  });
};

// Aktualisiere Windy-Link
const updateWindyLink = (map) => {
  const center = map.getCenter();
  windyLink.href = `https://www.windy.com/${center.lat.toFixed(3)}/${center.lng.toFixed(3)}?2025082400,${center.lat.toFixed(3)},${center.lng.toFixed(3)},10`;
};

// Hauptfunktion
async function init() {
  try {
    // Lade Daten
    const dataUrl = new URL('content/map/topspots.json', location.href).toString();
    const res = await fetch(dataUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const spots = await res.json();

    // Initialisiere Karte
    const map = L.map('map').setView([43.32, 16.45], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Erstelle Icons
    const icons = {
      anchorage: createIcon('anchorage'),
      harbor: createIcon('harbor'),
      landmark: createIcon('landmark')
    };

    // Füge Marker hinzu
    const markers = spots.map(spot => {
      const marker = L.marker([spot.lat, spot.lng], { 
        icon: icons[spot.type],
        title: spot.name
      });
      marker.bindPopup(() => createPopup(spot));
      return marker;
    });
    const markerGroup = L.featureGroup(markers).addTo(map);

    // Aktualisiere Windy-Link bei Kartenbewegung
    map.on('moveend', () => updateWindyLink(map));
    updateWindyLink(map);

    // Event Handler für Suche und Filter
    const updateView = () => {
      const search = searchInput.value;
      const activeTypes = Array.from(typeFilters)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      const filtered = filterSpots(spots, search, activeTypes);

      // Update Liste
      spotList.innerHTML = '';
      filtered.forEach(spot => {
        const li = createListItem(spot);
        li.addEventListener('click', () => {
          map.flyTo([spot.lat, spot.lng], 14);
          markers.find(m => m.getLatLng().lat === spot.lat)?.openPopup();
        });
        spotList.appendChild(li);
      });

      // Update Marker
      markers.forEach(marker => {
        const spot = spots.find(s => 
          s.lat === marker.getLatLng().lat && 
          s.lng === marker.getLatLng().lng
        );
        if (filtered.includes(spot)) {
          marker.addTo(map);
        } else {
          marker.remove();
        }
      });
    };

    // Event Listener
    searchInput.addEventListener('input', updateView);
    typeFilters.forEach(cb => cb.addEventListener('change', updateView));

    // Initial View
    updateView();

  } catch (err) {
    console.error(err);
    showToast('Konnte Spots nicht laden – ist content/map/topspots.json gepusht?');
  }
}

// Start
init();
