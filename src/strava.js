// Browser-side Strava calls. Delegates all OAuth and token logic to the
// backend (api/ directory) — the client secret must never appear in browser
// JavaScript.
//
// OAuth flow:
//   Browser -> /api/strava-authorize -> Strava consent -> /api/strava-callback
//   -> backend exchanges code for tokens -> browser receives session cookie
//   -> browser calls /api/strava-activities -> backend fetches from Strava API
//
// Paths match Vercel's default file-based routing (api/strava-callback.js ->
// /api/strava-callback) rather than a prettier /strava/... shape, so no
// vercel.json rewrite is needed.

// Empty string: frontend and api/ are served from the same origin under
// both `vercel dev` and a real Vercel deployment.
const API_BASE = '';

export function connectStrava() {
  window.location.href = `${API_BASE}/api/strava-authorize`;
}

// Returns null if the browser isn't connected to Strava yet (expected for
// most visitors) rather than throwing, so callers don't need to special-case it.
export async function getActivities() {
  const response = await fetch(`${API_BASE}/api/strava-activities`, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Unable to load Strava activities');
  const { points } = await response.json();
  return points;
}

// Renders accumulated [lat, lon] points as a MapLibre heatmap layer.
export function renderHeatmap(map, points) {
  const addHeatmap = () => {
    const data = {
      type: 'FeatureCollection',
      features: points.map(([lat, lon]) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [lon, lat] },
      })),
    };

    if (map.getSource('strava-heat')) {
      map.getSource('strava-heat').setData(data);
      return;
    }

    map.addSource('strava-heat', { type: 'geojson', data });
    map.addLayer({
      id: 'strava-heat',
      type: 'heatmap',
      source: 'strava-heat',
      maxzoom: 14,
      paint: {
        'heatmap-radius': 18,
        'heatmap-blur': 22,
        'heatmap-opacity': 0.72,
        'heatmap-weight': 1,
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 14, 1.5],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(63, 122, 82, 0)',
          0.2, 'rgba(63, 122, 82, 0.35)',
          0.5, 'rgba(181, 72, 47, 0.65)',
          1, 'rgba(181, 72, 47, 0.9)',
        ],
      },
    });
  };

  if (map.isStyleLoaded()) addHeatmap();
  else map.once('load', addHeatmap);
}
