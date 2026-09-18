// =============================================================================
// PLACEHOLDER — NOT YET IMPLEMENTED
//
// Serverless function: receives Strava's OAuth callback, exchanges the
// authorisation code for access + refresh tokens, and stores them securely.
//
// Required environment variables:
//   STRAVA_CLIENT_ID
//   STRAVA_CLIENT_SECRET  — never expose this in browser JavaScript
//   STRAVA_REDIRECT_URI
//   TOKEN_STORE_SECRET    — used to sign the session cookie (e.g. a random 32-byte hex string)
//
// Security notes:
//   - Store the refresh token server-side only (database, KV store, encrypted cookie).
//   - Return a short-lived, HTTP-only session cookie to the browser — not the raw tokens.
//   - Never send access_token or refresh_token to the frontend.
//
// After a successful exchange, redirect the browser back to the frontend:
//   res.redirect('https://mcourtis.github.io/dartmoor-tors/')
// =============================================================================

module.exports = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.status(400).json({ error: `Strava denied access: ${error}` });
    return;
  }

  if (!code) {
    res.status(400).json({ error: 'Missing authorisation code.' });
    return;
  }

  // TODO: implement token exchange.
  // const tokenRes = await fetch('https://www.strava.com/oauth/token', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     client_id:     process.env.STRAVA_CLIENT_ID,
  //     client_secret: process.env.STRAVA_CLIENT_SECRET,
  //     code,
  //     grant_type: 'authorization_code',
  //   }),
  // });
  // const tokens = await tokenRes.json();
  // Store tokens.refresh_token securely, then set a session cookie and redirect.

  res.status(501).json({ error: '[PLACEHOLDER] strava-callback: not yet implemented.' });
};
