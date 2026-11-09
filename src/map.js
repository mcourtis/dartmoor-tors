/* global maplibregl */

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
    const element = document.createElement('div');
    element.className = 'tor-marker';
    element.innerHTML = svg;
    element.setAttribute('aria-label', tor.name);
    return element;
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
  const element = document.createElement('div');
  element.className = 'tor-marker';
  element.innerHTML = svg;
  element.setAttribute('aria-label', tor.name);
  return element;
}

export function initMap(elementId) {
  const map = new maplibregl.Map({
    container: elementId,
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=cb1_55nd_1_6d18d9d007ed1373e7668fbd',
    center: [-3.97, 50.585],
    zoom: 11,
  });
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  return map;
}

export function createMarkerLayer(map) {
  const active = new Set();
  return {
    clearLayers() {
      active.forEach(marker => marker.remove());
      active.clear();
    },
    addLayer(marker) {
      if (!active.has(marker)) {
        marker.addTo(map);
        active.add(marker);
      }
      return this;
    },
    hasLayer(marker) {
      return active.has(marker);
    },
  };
}

export function createMarkers(map, tors) {
  return tors.map(tor => {
    const modeLabel = tor.mode === 'R' ? 'Run' : tor.mode === 'H' ? 'Hike' : 'Not yet done';
    const content = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'popup-title';
    title.textContent = tor.name;
    content.appendChild(title);
    [
      `${tor.height} m · ${modeLabel}`,
      tor.ref,
    ].forEach(text => {
      const line = document.createElement('div');
      line.className = 'popup-meta';
      line.textContent = text;
      content.appendChild(line);
    });
    if (tor.lowPrecision) {
      const note = document.createElement('div');
      note.className = 'approx-flag';
      note.textContent = 'Approximate location — grid ref in source data was incomplete';
      content.appendChild(note);
    }
    const popup = new maplibregl.Popup({ closeButton: true, offset: 8 }).setDOMContent(content);
    const marker = new maplibregl.Marker({ element: triIcon(tor), anchor: 'bottom' })
      .setLngLat([tor.lon, tor.lat])
      .setPopup(popup);
    marker.tor = tor;
    marker.openPopup = () => popup.setLngLat([tor.lon, tor.lat]).addTo(map);
    return marker;
  });
}

export function zoomToTor(map, markerLayer, markers, tor, zoom = 15) {
  map.flyTo({ center: [tor.lon, tor.lat], zoom, essential: true });
  const marker = markers.find(candidate => candidate.tor === tor);
  if (!marker) return;
  if (!markerLayer.hasLayer(marker)) markerLayer.addLayer(marker);
  marker.openPopup();
}
