// =============================================================================
// PLACEHOLDER — NOT YET IMPLEMENTED
//
// Serverless function: redirects the user to Strava's OAuth consent page.
// Written for Vercel Functions (Node.js runtime). Adapt exports for Netlify
// Functions or Cloudflare Workers as needed.
//
// Required environment variables (set in your hosting platform, never in code):
//   STRAVA_CLIENT_ID      — from your Strava API application settings
//   STRAVA_REDIRECT_URI   — must match exactly what you registered with Strava
//                           e.g. https://your-api.example.com/strava/callback
//
// Strava API application: https://www.strava.com/settings/api
// =============================================================================

module.exports = (req, res) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'STRAVA_CLIENT_ID and STRAVA_REDIRECT_URI must be set.' });
    return;
  }

  // TODO: implement OAuth redirect.
  // const url = new URL('https://www.strava.com/oauth/authorize');
  // url.searchParams.set('client_id', clientId);
  // url.searchParams.set('redirect_uri', redirectUri);
  // url.searchParams.set('response_type', 'code');
  // url.searchParams.set('scope', 'read,activity:read');
  // res.redirect(url.toString());

  res.status(501).json({ error: '[PLACEHOLDER] strava-authorize: not yet implemented.' });
};
