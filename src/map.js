/* global L */
// Leaflet is loaded via CDN in index.html and available as the global `L`.
// When switching to Vite + npm, replace the comment above with:
//   import L from 'leaflet';

let hatchCounter = 0;

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function triIcon(tor) {
  const color = tor.mode === 'R' ? getCss('--run')
              : tor.mode === 'H' ? getCss('--hike')
              : getCss('--blank');

  if (!tor.lowPrecision) {
    const svg = `<svg width="18" height="17" viewBox="0 0 18 17" xmlns="http://www.w3.org/2000/svg">
      <polygon points="9,1 17,16 1,16" fill="${color}"/>
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [18, 17], iconAnchor: [9, 16], popupAnchor: [0, -16] });
  }

  // Low-precision tors: hatch the fill so approximate location stays visually distinct
  // regardless of mode colour (red/green/grey all get the hatched treatment).
  const uid = 'hatch' + (hatchCounter++);
  const svg = `<svg width="18" height="17" viewBox="0 0 18 17" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="${uid}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="4" fill="${color}"/>
        <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" stroke-width="1.6"/>
      </pattern>
    </defs>
    <polygon points="9,1 17,16 1,16" fill="url(#${uid})" stroke="${color}" stroke-width="0.75"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [18, 17], iconAnchor: [9, 16], popupAnchor: [0, -16] });
}

export function initMap(elementId) {
  const map = L.map(elementId, { zoomControl: true }).setView([50.585, -3.97], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  }).addTo(map);
  return map;
}

export function createMarkers(tors) {
  return tors.map(tor => {
    const modeLabel = tor.mode === 'R' ? 'Run' : tor.mode === 'H' ? 'Hike' : 'Not yet done';
    const marker = L.marker([tor.lat, tor.lon], { icon: triIcon(tor) });
    marker.bindPopup(
      `<div class="popup-title">${tor.name}</div>` +
      `<div class="popup-meta">${tor.height} m · ${modeLabel}</div>` +
      `<div class="popup-meta">${tor.ref}</div>` +
      (tor.lowPrecision ? `<div class="approx-flag">Approximate location — grid ref in source data was incomplete</div>` : '')
    );
    marker.tor = tor;
    return marker;
  });
}

export function zoomToTor(map, markerLayer, markers, tor, zoom = 15) {
  map.setView([tor.lat, tor.lon], zoom);
  const marker = markers.find(candidate => candidate.tor === tor);
  if (!marker) return;
  if (!markerLayer.hasLayer(marker)) markerLayer.addLayer(marker);
  marker.openPopup();
}
