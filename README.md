# The Definitive Dartmoor Tor Map

One person's very serious opinion on where the tors are.

An interactive map of Dartmoor's tors, built with [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/).
Zoom in, poke around, and enjoy the quiet confidence of a map that has never once 
doubted itself.

## Live map

[View it here](#) *(update once your GitHub Pages URL is live)*

## What's on it

- Dartmoor's tors, plotted and (mostly) correctly labelled
- A legend for the various markers, because granite lumps deserve categorisation

## Planned upgrades

- [ ] Click Tor -> Auto-zoom
- [ ] ? (maybe only served by spreadsheet update?) Click to add tors completion (although this should only be served by me)
- [x] Strava API integration — overlay a personal heatmap of routes/visits
- [ ] Photos and descriptions for each tor, pulled from reference sources
- [ ] More dynamic filtering (by difficulty, height, region, etc.)

## Strava setup

The heatmap overlay needs a small backend (`api/`) deployed separately from
this static site, because the Strava client secret must never reach the
browser.

1. Create a Strava API application at
   [strava.com/settings/api](https://www.strava.com/settings/api):
   - **Authorization Callback Domain** — the bare domain of your Vercel
     deployment, e.g. `your-vercel-app.vercel.app` (no scheme, no path).
   - Note the client ID and client secret it gives you.
2. Deploy the `api/` folder as Vercel Functions (or adapt for another
   serverless platform — the handlers are plain Node functions). Vercel
   serves `api/strava-callback.js` at `/api/strava-callback`, etc.
3. In the Vercel project's environment variables, set:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_REDIRECT_URI` — e.g.
     `https://<your-vercel-app>/api/strava-callback`
   - `TOKEN_STORE_SECRET` — a random 32-byte hex string (`openssl rand -hex 32`)
   - `FRONTEND_URL` — where this site is hosted, e.g.
     `https://mcourtis.github.io/dartmoor-tors/`
4. Set `API_BASE` in `src/strava.js` to the deployed backend's root URL.

## Basemap

The map uses CARTO's Voyager vector style through MapLibre GL JS. The CARTO
Basemaps API key is included in the style URL in `src/map.js`; restrict that key
to the deployed site's domain in the CARTO dashboard. CARTO's free tier allows
up to 5 million monthly tile requests for non-commercial use or 1 million for
commercial use. Keep the OpenStreetMap and CARTO attribution visible.

## Tor data updates

The app loads the public **My List** CSV from Google Sheets at startup. A
successful fetch is cached in that browser's local storage and is used if a
later fetch fails. The checked-in `data/tors.js` is the shared fallback; the
**Refresh tor snapshot** GitHub Actions workflow refreshes it daily at 06:17 UTC
or on demand from the Actions tab. The spreadsheet must remain anonymously
viewable for both runtime fetches and the snapshot workflow to work.

## Built with

- HTML/CSS/JS
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) for the mapping

## License

MIT — see [LICENSE](LICENSE) for details. Do what you like with it, 
just don't blame me if you roll an ankle.
