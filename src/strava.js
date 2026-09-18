// =============================================================================
// PLACEHOLDER — NOT YET IMPLEMENTED
//
// This module handles browser-side Strava calls. It delegates all OAuth and
// token logic to the backend (api/ directory) — the client secret must never
// appear in browser JavaScript.
//
// Before activating:
//   1. Deploy the three functions in api/ to Vercel, Netlify, or similar.
//   2. Set API_BASE below to the deployed backend root URL.
//   3. Uncomment the Strava button in index.html.
//   4. Uncomment the Strava block in src/main.js.
//
// OAuth flow:
//   Browser → /strava/authorize → Strava consent → /strava/callback
//   → backend exchanges code for tokens → browser receives session cookie
//   → browser calls /strava/activities → backend fetches from Strava API
// =============================================================================

// Replace with the URL of your deployed backend.
const API_BASE = 'https://your-api.example.com';

export function connectStrava() {
  throw new Error('[PLACEHOLDER] connectStrava: set API_BASE and deploy api/strava-authorize.js first.');
  // Uncomment once backend is live:
  // window.location.href = `${API_BASE}/strava/authorize`;
}

export async function getActivities() {
  throw new Error('[PLACEHOLDER] getActivities: set API_BASE and deploy api/strava-activities.js first.');
  // Uncomment once backend is live:
  // const response = await fetch(`${API_BASE}/strava/activities`, { credentials: 'include' });
  // if (!response.ok) throw new Error('Unable to load Strava activities');
  // return response.json();
}

// Called by main.js once getActivities() returns data.
// Decodes Strava's encoded polyline format before handing coordinates to Leaflet.
export function addActivityToMap(_map, _activity) {
  throw new Error('[PLACEHOLDER] addActivityToMap: implement polyline decoding and add Leaflet layer.');
  // Rough shape of the implementation:
  //
  // import { decodePolyline } from './polyline.js'; // add a small decoder utility
  //
  // const coordinates = decodePolyline(_activity.map.summary_polyline);
  // return L.polyline(coordinates, {
  //   color: '#b5482f',
  //   weight: 3,
  //   opacity: 0.7,
  // }).addTo(_map);
}
