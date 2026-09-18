// =============================================================================
// PLACEHOLDER — NOT YET IMPLEMENTED
//
// Serverless function: returns Strava activity data to the authenticated browser.
// Uses the stored refresh token to obtain a fresh access token, then fetches
// activities from the Strava API and returns only the fields the map needs.
//
// Required environment variables:
//   STRAVA_CLIENT_ID
//   STRAVA_CLIENT_SECRET
//   TOKEN_STORE_SECRET    — to verify/decrypt the session cookie
//
// What this endpoint should do:
//   1. Validate the session cookie from the browser request.
//   2. Retrieve the stored refresh token for this user.
//   3. POST to https://www.strava.com/oauth/token with grant_type=refresh_token.
//   4. Use the new access_token to GET https://www.strava.com/api/v3/athlete/activities.
//   5. Return only the fields the frontend needs (e.g. name, start_latlng, map.summary_polyline).
//   6. Cache the response appropriately to avoid hitting Strava rate limits.
//
// Strava rate limits: 100 requests per 15 minutes, 1000 per day.
// =============================================================================

module.exports = async (req, res) => {
  // TODO: validate session cookie.
  // TODO: retrieve refresh token from secure store.
  // TODO: refresh access token via Strava token endpoint.
  // TODO: fetch activities and filter to required fields.
  // TODO: return JSON to browser.

  res.status(501).json({ error: '[PLACEHOLDER] strava-activities: not yet implemented.' });
};
