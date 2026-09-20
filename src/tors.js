import { RAW_TORS } from '../data/tors.js';
import { sxRefToEN, gridXYToEN, toLatLon } from './geo.js';

export function buildTors() {
  return RAW_TORS.map(row => {
    const [name, ref, height, mode, book, mapCol, gx, gy] = row;
    const lowPrecision = !ref;
    const en = lowPrecision ? gridXYToEN(gx, gy) : sxRefToEN(ref);
    const ll = toLatLon(en.e, en.n);
    return {
      name,
      ref: ref || `(from grid ${gx}/${gy})`,
      height,
      mode,
      book,
      mapCol,
      lowPrecision,
      lat: ll.lat,
      lon: ll.lon,
    };
  });
}
