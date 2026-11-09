/* global maplibregl */
import { buildTors } from './tors.js';
import { initMap, createMarkerLayer, createMarkers, zoomToTor } from './map.js';
import { applyFilters, updateStats, renderList } from './filters.js';
import { fetchSheetRows, readCachedSnapshot, writeCachedSnapshot } from './tor-data.js';
import { RAW_TORS } from '../data/tors.js';

const map = initMap('map');
const layer = createMarkerLayer(map);
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const dataStatusEl = document.getElementById('tor-data-status');
const subtitleEl = document.querySelector('header .sub');
const requestedTor = new URLSearchParams(window.location.search).get('tor');
let TORS = [];
let markers = [];

function doApplyFilters() {
  const checked = applyFilters(markers, layer);
  updateStats(markers, TORS, checked);
}

function doRenderList(filterText) {
  renderList(listEl, TORS, tor => zoomToTor(map, layer, markers, tor), filterText);
}

function renderTors(tors) {
  TORS = tors;
  layer.clearLayers();
  markers = createMarkers(map, TORS);
  markers.forEach(marker => layer.addLayer(marker));
  subtitleEl.textContent = `${TORS.length} tors · triangles mark tors · fill colour shows completed mode`;
  doRenderList(searchEl.value);
  doApplyFilters();

  if (requestedTor) {
    const tor = TORS.find(item => item.name.toLowerCase() === requestedTor.toLowerCase());
    if (tor) zoomToTor(map, layer, markers, tor);
  }
}

function formatTime(value) {
  return new Date(value).toLocaleString();
}

document.querySelectorAll('#filters input').forEach(i => i.addEventListener('change', doApplyFilters));
searchEl.addEventListener('input', e => doRenderList(e.target.value));

let cachedSnapshot = readCachedSnapshot();
if (cachedSnapshot) {
  try {
    renderTors(buildTors(cachedSnapshot.rows));
    dataStatusEl.textContent = `Saved sheet copy · ${formatTime(cachedSnapshot.fetchedAt)} · checking for updates`;
  } catch (error) {
    console.warn('Saved tor snapshot is invalid; using the bundled copy.', error);
    cachedSnapshot = null;
    renderTors(buildTors(RAW_TORS));
    dataStatusEl.textContent = 'Using bundled tor data · checking spreadsheet';
  }
} else {
  renderTors(buildTors(RAW_TORS));
  dataStatusEl.textContent = 'Using bundled tor data · checking spreadsheet';
}

fetchSheetRows()
  .then(rows => {
    const updatedTors = buildTors(rows);
    const fetchedAt = new Date().toISOString();
    const saved = writeCachedSnapshot(rows, fetchedAt);
    renderTors(updatedTors);
    dataStatusEl.textContent = `Live spreadsheet · ${formatTime(fetchedAt)}${saved ? '' : ' · browser backup unavailable'}`;
  })
  .catch(error => {
    console.warn('Could not refresh tor data from the spreadsheet.', error);
    const fallbackLabel = cachedSnapshot
      ? `Saved sheet copy · ${formatTime(cachedSnapshot.fetchedAt)}`
      : 'Bundled snapshot';
    dataStatusEl.textContent = `Spreadsheet unavailable · showing ${fallbackLabel}`;
  });

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

// Keep asynchronous data loading independent from the Strava integration.
