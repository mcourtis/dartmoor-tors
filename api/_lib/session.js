// Encrypts the Strava refresh token into an HTTP-only cookie so the
// stateless serverless functions don't need a database. AES-256-GCM keyed by
// TOKEN_STORE_SECRET (a 32-byte hex string set in the hosting platform).
const crypto = require('crypto');

const COOKIE_NAME = 'strava_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days — Strava refresh tokens don't expire on their own.

function getKey() {
  const secret = process.env.TOKEN_STORE_SECRET;
  if (!secret) throw new Error('TOKEN_STORE_SECRET is not set.');
  return Buffer.from(secret, 'hex');
}

function encryptRefreshToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64url');
}

function decryptRefreshToken(value) {
  const raw = Buffer.from(value, 'base64url');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => {
      const idx = part.indexOf('=');
      return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
    })
  );
}

function buildSessionCookie(refreshToken) {
  const value = encryptRefreshToken(refreshToken);
  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

function readSessionCookie(req) {
  const cookies = parseCookies(req);
  const value = cookies[COOKIE_NAME];
  if (!value) return null;
  try {
    return decryptRefreshToken(value);
  } catch {
    return null;
  }
}

function corsHeaders() {
  const origin = process.env.FRONTEND_URL || 'https://mcourtis.github.io';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };
}

module.exports = { buildSessionCookie, readSessionCookie, corsHeaders };
