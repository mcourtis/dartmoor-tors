// Serverless function: returns a flat list of [lat, lon] points, clipped to
// Dartmoor, accumulated from the athlete's Run/TrailRun/Hike activities.
// The browser renders these as a leaflet.heat layer (see src/strava.js).
//
// Pipeline: activities -> sport_type filter -> spatial pre-filter (bbox on
// start/end latlng) -> candidate activities -> GPS streams -> clip to bbox
// -> accumulated points.
//
// Required environment variables:
//   STRAVA_CLIENT_ID
//   STRAVA_CLIENT_SECRET
//   TOKEN_STORE_SECRET
//
// Strava rate limits: 100 requests per 15 minutes, 1000 per day — the
// response carries per-session data so it isn't edge-cached; the number of
// stream requests per invocation is capped below to stay within the limit.

const { readSessionCookie, buildSessionCookie, corsHeaders } = require('./_lib/session');
const { isInBbox } = require('./_lib/bbox');

const SPORT_TYPES = new Set(['Run', 'TrailRun', 'Hike']);
const MAX_STREAM_REQUESTS = 50; // stay well within the 15-minute rate limit per page load

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Strava token refresh failed.');
  return res.json();
}

function isCandidate(activity) {
  if (!SPORT_TYPES.has(activity.sport_type)) return false;
  const [startLat, startLon] = activity.start_latlng || [];
  const [endLat, endLon] = activity.end_latlng || [];
  return (
    (startLat !== undefined && isInBbox(startLat, startLon)) ||
    (endLat !== undefined && isInBbox(endLat, endLon))
  );
}

async function fetchStreamPoints(activityId, accessToken) {
  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const streams = await res.json();
  const latlng = streams.latlng?.data || [];
  return latlng.filter(([lat, lon]) => isInBbox(lat, lon));
}

module.exports = async (req, res) => {
  const headers = corsHeaders();
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  const refreshToken = readSessionCookie(req);
  if (!refreshToken) {
    res.status(401).json({ error: 'Not connected to Strava.' });
    return;
  }

  let tokens;
  try {
    tokens = await refreshAccessToken(refreshToken);
  } catch (err) {
    res.status(502).json({ error: err.message });
    return;
  }

  if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
    res.setHeader('Set-Cookie', buildSessionCookie(tokens.refresh_token));
  }

  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=200',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  if (!activitiesRes.ok) {
    res.status(502).json({ error: 'Failed to fetch Strava activities.' });
    return;
  }

  const activities = await activitiesRes.json();
  const candidates = activities.filter(isCandidate).slice(0, MAX_STREAM_REQUESTS);

  const points = [];
  for (const activity of candidates) {
    const activityPoints = await fetchStreamPoints(activity.id, tokens.access_token);
    points.push(...activityPoints);
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ points });
};
