/* global L */
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

// Replace with the URL of your deployed backend (e.g. a Vercel project root).
const API_BASE = 'https://your-api.example.com';

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

// Renders accumulated [lat, lon] points as a heat layer. Requires
// leaflet.heat to be loaded (see index.html). Returns the layer so callers
// can remove/toggle it later.
export function renderHeatmap(map, points) {
  return L.heatLayer(points, { radius: 18, blur: 22, maxZoom: 14 }).addTo(map);
}
