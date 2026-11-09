const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/17kcZV7F5cieMI8o62_9SKc9OWEFGX3M5viaItzJF7o0/export?format=csv&gid=425023295';
const CACHE_KEY = 'dartmoor-tors:sheet-snapshot:v1';
const CACHE_VERSION = 1;
const REQUIRED_HEADERS = ['Name', 'Grid Reference', 'Grid X', 'Grid Y', 'Height [m]', 'Run or Hike?', 'Book', 'Map'];

function optionalInteger(value, label) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isInteger(number)) throw new Error(`${label} must be a whole number.`);
  return number;
}

function normalizeMode(value, label) {
  const mode = String(value ?? '').trim().toUpperCase();
  if (mode === '' || mode === 'R' || mode === 'RUN') return mode === 'RUN' ? 'R' : mode;
  if (mode === 'H' || mode === 'HIKE') return mode === 'HIKE' ? 'H' : mode;
  throw new Error(`${label} has unsupported mode "${value}"; expected Run, Hike, R, H, or blank.`);
}

function normalizeFlag(value, label) {
  const flag = String(value ?? '').trim().toUpperCase();
  if (flag === '' || flag === 'Y') return flag;
  throw new Error(`${label} must be Y or blank.`);
}

export function validateTorRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No tor rows were found.');
  const names = new Set();
  return rows.map((row, index) => {
    const label = `Tor row ${index + 1}`;
    if (!Array.isArray(row) || row.length < 8) throw new Error(`${label} does not have eight columns.`);
    const name = String(row[0] ?? '').trim();
    if (!name) throw new Error(`${label} is missing a name.`);
    const nameKey = name.toLocaleLowerCase();
    if (names.has(nameKey)) throw new Error(`Duplicate tor name: ${name}.`);
    names.add(nameKey);

    const refText = String(row[1] ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const ref = refText || null;
    if (ref && !/^SX(?:\d{2}){2,5}$/.test(ref)) throw new Error(`${label} has invalid grid reference "${row[1]}".`);
    const heightText = String(row[2] ?? '').trim();
    const height = Number(heightText);
    if (!heightText || !Number.isFinite(height) || height < 0 || height > 2000) throw new Error(`${label} has invalid height.`);
    const mode = normalizeMode(row[3], label);
    const book = normalizeFlag(row[4], `${label} Book`);
    const map = normalizeFlag(row[5], `${label} Map`);
    const gx = optionalInteger(row[6], `${label} Grid X`);
    const gy = optionalInteger(row[7], `${label} Grid Y`);
    if ((gx !== null && (gx < 0 || gx > 99)) || (gy !== null && (gy < 0 || gy > 99))) {
      throw new Error(`${label} has out-of-range fallback grid coordinates.`);
    }
    if (!ref && (gx === null || gy === null || gx < 0 || gx > 99 || gy < 0 || gy > 99)) {
      throw new Error(`${label} needs a valid grid reference or fallback Grid X/Grid Y values.`);
    }
    return [name, ref, height, mode, book, map, gx, gy];
  });
}

export function parseSheetCsv(csvText) {
  if (typeof window.Papa === 'undefined') throw new Error('CSV parser did not load.');
  const parsed = window.Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header => header.replace(/^\uFEFF/, '').trim(),
  });
  if (parsed.errors.length) {
    throw new Error(`Could not parse spreadsheet CSV: ${parsed.errors[0].message}`);
  }
  const headers = parsed.meta.fields || [];
  const missing = REQUIRED_HEADERS.filter(header => !headers.includes(header));
  if (missing.length) throw new Error(`Spreadsheet is missing columns: ${missing.join(', ')}.`);

  const rows = [];
  parsed.data.forEach((record, index) => {
    const name = String(record.Name ?? '').trim();
    if (!name || name.toUpperCase() === 'COUNT') return; // Ignore blank and summary rows.
    const ref = String(record['Grid Reference'] ?? '').trim();
    const gx = String(record['Grid X'] ?? '').trim();
    const gy = String(record['Grid Y'] ?? '').trim();
    const hasLocation = Boolean(ref) || (Boolean(gx) && Boolean(gy));
    if (!hasLocation) throw new Error(`Spreadsheet row ${index + 2} has a name but no usable location.`);
    rows.push([
      name,
      ref,
      record['Height [m]'],
      record['Run or Hike?'],
      record.Book,
      record.Map,
      gx,
      gy,
    ]);
  });
  return validateTorRows(rows);
}

export async function fetchSheetRows() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(SHEET_CSV_URL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Spreadsheet request failed (${response.status}).`);
    return parseSheetCsv(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

export function readCachedSnapshot() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!cached || cached.version !== CACHE_VERSION || !Array.isArray(cached.rows)) return null;
    const rows = validateTorRows(cached.rows);
    const fetchedAt = new Date(cached.fetchedAt);
    if (!Number.isFinite(fetchedAt.getTime())) return null;
    return { rows, fetchedAt: fetchedAt.toISOString() };
  } catch {
    return null;
  }
}

export function writeCachedSnapshot(rows, fetchedAt = new Date().toISOString()) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, fetchedAt, rows }));
    return true;
  } catch {
    return false;
  }
}
