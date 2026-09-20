/* global L */
import { buildTors } from './tors.js';
import { initMap, createMarkers, zoomToTor } from './map.js';
import { applyFilters, updateStats, renderList } from './filters.js';

const TORS = buildTors();
const map = initMap('map');
const markers = createMarkers(TORS);
const layer = L.layerGroup(markers).addTo(map);
const listEl = document.getElementById('list');

function doApplyFilters() {
  const checked = applyFilters(markers, layer);
  updateStats(markers, TORS, checked);
}

function doRenderList(filterText) {
  renderList(listEl, TORS, tor => zoomToTor(map, layer, markers, tor), filterText);
}

document.querySelectorAll('#filters input').forEach(i => i.addEventListener('change', doApplyFilters));
document.getElementById('search').addEventListener('input', e => doRenderList(e.target.value));

// Handle ?tor=Name URL parameter — zoom to a named tor on page load.
// Example: index.html?tor=Haytor
const torParam = new URLSearchParams(window.location.search).get('tor');
if (torParam) {
  const tor = TORS.find(t => t.name.toLowerCase() === torParam.toLowerCase());
  if (tor) zoomToTor(map, layer, markers, tor);
}

// Strava integration — set API_BASE in src/strava.js once the api/ backend
// is deployed. Until then, connecting will fail with a logged fetch error.
import { connectStrava, getActivities, renderHeatmap } from './strava.js';

const stravaBtn = document.querySelector('#connect-strava');
if (stravaBtn) {
  stravaBtn.addEventListener('click', connectStrava);
}

getActivities()
  .then(points => { if (points) renderHeatmap(map, points); })
  .catch(err => console.error('Strava error:', err));

doRenderList('');
doApplyFilters();
