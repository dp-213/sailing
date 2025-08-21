const DATA_URL = new URL('content/map/topspots.json?v=2025-08-21-1', document.baseURI).toString();

// DOM Elements
const spotList = document.getElementById('spot-list');
const searchInput = document.getElementById('q');
const typeFilters = document.querySelectorAll('.chips input[type="checkbox"]');
const windyLink = document.getElementById('windy-link');
const toastEl = document.getElementById('toast');

// Leaflet Default Icon Fix für Safari
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

function popupHtml(s) {
  const ll = `${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}`;
  return `
    <div class="popup">
      <h3>${s.name}</h3>
      <div class="meta">${s.typeLabel || s.type || ''} ${s.bestLight ? `· ${s.bestLight}` : ''}</div>
      <div class="sec"><strong>Für Instagram</strong><br>${s.instagram || s.insta || ''}</div>
      <div class="sec"><strong>Skipper Tipps</strong><br>${s.skipper || ''}</div>
      <div class="sec coords">Koordinaten: <span class="mono">${ll}</span>
        <button class="copy" data-ll="${ll}">kopieren</button>
      </div>
    </div>
  `;
}

// Rendere Popup-Inhalt
const createPopup = (spot) => {
  const div = document.createElement('div');
  div.innerHTML = popupHtml(spot);

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
// State
let spots = [];
let activeSpot = null;
let map = null;

// Load and initialize
async function init() {
  try {
    spots = await loadSpots();
    console.log('[TopSpots] loaded', spots.length, 'spots from', DATA_URL);
    initMap();
    bindSearch();
    bindFilters();
    renderSpots();
  } catch (error) {
    console.error('Fehler beim Laden der Spots:', error);
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
      Fehler beim Laden der Spots.
      <button onclick="init()">Erneut laden</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
}

async function loadSpots() {
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.json();
  const spots = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.spots) ? raw.spots : []);
  return spots.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
}

// Initialisiere Karte
function initMap() {
  map = L.map('map').setView([54.5, 11], 8);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  map.on('moveend', () => updateWindyLink(map));
}

// Suchfunktionalität
function bindSearch() {
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      renderSpots(e.target.value);
    }, 300);
  });
}

// Filter-Funktionalität
function bindFilters() {
  typeFilters.forEach(filter => {
    filter.addEventListener('change', () => {
      renderSpots(searchInput.value);
    });
  });
}

// Rendere gefilterte Spots
function renderSpots(search = '') {
  // Aktiviere standardmäßig alle Filter beim ersten Aufruf
  if (!document.querySelector('.chips input:checked')) {
    typeFilters.forEach(f => f.checked = true);
  }
  
  const activeTypes = Array.from(typeFilters)
    .filter(f => f.checked)
    .map(f => f.value);

  const filteredSpots = filterSpots(spots, search, activeTypes);
  
  // Liste leeren und neu befüllen
  spotList.innerHTML = '';
  
  // Zähler anzeigen
  const counter = document.createElement('div');
  counter.className = 'spot-counter';
  counter.textContent = `Spots: ${filteredSpots.length}`;
  spotList.appendChild(counter);
  
  if (filteredSpots.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      Keine Treffer.
      <button onclick="resetFilters()">Filter zurücksetzen</button>
    `;
    spotList.appendChild(noResults);
    return;
  }
  
  filteredSpots.forEach(spot => {
    const li = createListItem(spot);
    li.addEventListener('click', () => {
      activeSpot?.marker.closePopup();
      spot.marker.openPopup();
      activeSpot = spot;
    });
    spotList.appendChild(li);
  });

  // Marker auf der Karte aktualisieren
  spots.forEach(spot => {
    if (!spot.marker) {
      spot.marker = L.marker([spot.lat, spot.lng], {
        icon: createIcon(spot.type)
      })
      .bindPopup(() => createPopup(spot))
      .addTo(map);
    }
    spot.marker.setOpacity(filteredSpots.includes(spot) ? 1 : 0.3);
  });
}

// Start
init();
