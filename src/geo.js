// OS National Grid (SX square) → WGS84 lat/lon conversion.
// SX 100km square false origin: easting 200000 m, northing 0 m.

export function sxRefToEN(ref) {
  const digits = ref.replace(/^SX/i, '').trim();
  const n = digits.length / 2;
  const scale = Math.pow(10, 5 - n);
  const e = 200000 + Number(digits.slice(0, n)) * scale;
  const northing = 0 + Number(digits.slice(n)) * scale;
  return { e, n: northing };
}

// gridX/gridY are km offsets within the SX square; returns centre of the 1km cell.
export function gridXYToEN(gx, gy) {
  return { e: 200000 + gx * 1000 + 500, n: 0 + gy * 1000 + 500 };
}

function osGridToLatLonOSGB36(E, N) {
  const a = 6377563.396, b = 6356256.909, F0 = 0.9996012717;
  const lat0 = 49 * Math.PI / 180, lon0 = -2 * Math.PI / 180;
  const N0 = -100000, E0 = 400000;
  const e2 = 1 - (b * b) / (a * a);
  const n = (a - b) / (a + b), n2 = n * n, n3 = n * n * n;

  let lat = lat0, M = 0;
  do {
    lat = (N - N0 - M) / (a * F0) + lat;
    const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (lat - lat0);
    const Mb = (3 * n + 3 * n2 + (21 / 8) * n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    const Mc = ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
    const Md = (35 / 24) * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);
  } while (N - N0 - M >= 0.00001);

  const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  const nu = a * F0 / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;
  const tanLat = Math.tan(lat);
  const tan2 = tanLat * tanLat, tan4 = tan2 * tan2, tan6 = tan4 * tan2;
  const secLat = 1 / cosLat;
  const nu3 = nu * nu * nu, nu5 = nu3 * nu * nu, nu7 = nu5 * nu * nu;

  const VII  = tanLat / (2 * rho * nu);
  const VIII = tanLat / (24 * rho * nu3) * (5 + 3 * tan2 + eta2 - 9 * tan2 * eta2);
  const IX   = tanLat / (720 * rho * nu5) * (61 + 90 * tan2 + 45 * tan4);
  const X    = secLat / nu;
  const XI   = secLat / (6 * nu3) * (nu / rho + 2 * tan2);
  const XII  = secLat / (120 * nu5) * (5 + 28 * tan2 + 24 * tan4);
  const XIIA = secLat / (5040 * nu7) * (61 + 662 * tan2 + 1320 * tan4 + 720 * tan6);

  const dE = E - E0;
  const dE2 = dE * dE, dE3 = dE2 * dE, dE4 = dE2 * dE2;
  const dE5 = dE3 * dE2, dE6 = dE4 * dE2, dE7 = dE5 * dE2;

  const finalLat = lat - VII * dE2 + VIII * dE4 - IX * dE6;
  const finalLon = lon0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7;
  return { lat: finalLat * 180 / Math.PI, lon: finalLon * 180 / Math.PI };
}

function osgb36ToWGS84(lat, lon) {
  const phi = lat * Math.PI / 180, lambda = lon * Math.PI / 180;
  const a1 = 6377563.396, b1 = 6356256.909;
  const e2 = 1 - (b1 * b1) / (a1 * a1);
  const sinP = Math.sin(phi), cosP = Math.cos(phi);
  const sinL = Math.sin(lambda), cosL = Math.cos(lambda);
  const nu = a1 / Math.sqrt(1 - e2 * sinP * sinP);
  const x1 = nu * cosP * cosL, y1 = nu * cosP * sinL, z1 = (1 - e2) * nu * sinP;

  const tx = 446.448, ty = -125.157, tz = 542.060;
  const s = -20.4894e-6;
  const rx = (0.1502 / 3600) * Math.PI / 180;
  const ry = (0.2470 / 3600) * Math.PI / 180;
  const rz = (0.8421 / 3600) * Math.PI / 180;

  const x2 = tx + (1 + s) * x1 + (-rz) * y1 + (ry) * z1;
  const y2 = ty + (rz) * x1 + (1 + s) * y1 + (-rx) * z1;
  const z2 = tz + (-ry) * x1 + (rx) * y1 + (1 + s) * z1;

  const a2 = 6378137.000, b2 = 6356752.3141;
  const e2b = 1 - (b2 * b2) / (a2 * a2);
  const p = Math.sqrt(x2 * x2 + y2 * y2);
  let phi2 = Math.atan2(z2, p * (1 - e2b));
  for (let i = 0; i < 10; i++) {
    const sp = Math.sin(phi2);
    const nu2 = a2 / Math.sqrt(1 - e2b * sp * sp);
    phi2 = Math.atan2(z2 + e2b * nu2 * sp, p);
  }
  const lambda2 = Math.atan2(y2, x2);
  return { lat: phi2 * 180 / Math.PI, lon: lambda2 * 180 / Math.PI };
}

export function toLatLon(E, N) {
  const osgb = osGridToLatLonOSGB36(E, N);
  return osgb36ToWGS84(osgb.lat, osgb.lon);
}
