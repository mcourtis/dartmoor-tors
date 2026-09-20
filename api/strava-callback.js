// Serverless function: receives Strava's OAuth callback, exchanges the
// authorisation code for tokens, and stores the refresh token in an
// encrypted, HTTP-only session cookie (see api/_lib/session.js).
//
// Required environment variables:
//   STRAVA_CLIENT_ID
//   STRAVA_CLIENT_SECRET  — never expose this in browser JavaScript
//   TOKEN_STORE_SECRET    — 32-byte hex string used to encrypt the session cookie
//   FRONTEND_URL          — where to redirect after a successful exchange
//                           (defaults to https://mcourtis.github.io)

const { buildSessionCookie } = require('./_lib/session');

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

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    res.status(502).json({ error: 'Strava token exchange failed.' });
    return;
  }

  const tokens = await tokenRes.json();
  const frontendUrl = process.env.FRONTEND_URL || 'https://mcourtis.github.io/dartmoor-tors/';

  res.setHeader('Set-Cookie', buildSessionCookie(tokens.refresh_token));
  res.redirect(frontendUrl);
};
