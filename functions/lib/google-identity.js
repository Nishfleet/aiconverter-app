
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const CLOCK_SKEW_SECONDS = 60;
const DEFAULT_KEY_CACHE_SECONDS = 3600;
const FAILED_FETCH_RETRY_SECONDS = 30;

let keyCache = { keys: null, expiresAt: 0 };

export const SHEETS_ADDON_CLIENT = "sheets-addon";

export function sheetsAddonClientIds(env) {
  return String(env?.GOOGLE_SHEETS_ADDON_CLIENT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isSheetsAddonRequest(request) {
  return (request.headers.get("X-AIConverter-Client") || "").trim().toLowerCase() === SHEETS_ADDON_CLIENT;
}

export function bearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export async function verifySheetsAddonIdentity(env, request, { fetchImpl = fetch, now = Date.now() } = {}) {
  const audiences = sheetsAddonClientIds(env);
  if (!audiences.length) {
    return { ok: false, status: 503, message: "The Google Sheets add-on is not enabled yet." };
  }

  const token = bearerToken(request);
  if (!token) return { ok: false, status: 401, message: "Sign in to Google Sheets again and retry." };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, status: 401, message: "Your Google sign-in could not be verified." };

  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlToString(parts[0]));
    payload = JSON.parse(base64UrlToString(parts[1]));
  } catch {
    return { ok: false, status: 401, message: "Your Google sign-in could not be verified." };
  }

  if (header.alg !== "RS256" || !header.kid) {
    return { ok: false, status: 401, message: "Your Google sign-in could not be verified." };
  }

  const keys = await googleSigningKeys(fetchImpl, now);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) return { ok: false, status: 401, message: "Your Google sign-in could not be verified." };

  const signatureValid = await verifyRs256(jwk, `${parts[0]}.${parts[1]}`, base64UrlToBytes(parts[2]));
  if (!signatureValid) return { ok: false, status: 401, message: "Your Google sign-in could not be verified." };

  const nowSeconds = Math.floor(now / 1000);
  const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (
    !GOOGLE_ISSUERS.has(payload.iss) ||
    !tokenAudiences.some((aud) => audiences.includes(aud)) ||
    !Number.isFinite(payload.exp) ||
    payload.exp + CLOCK_SKEW_SECONDS < nowSeconds ||
    (Number.isFinite(payload.iat) && payload.iat - CLOCK_SKEW_SECONDS > nowSeconds) ||
    !payload.sub
  ) {
    return { ok: false, status: 401, message: "Your Google sign-in has expired. Reopen the add-on and retry." };
  }

  if (payload.email && payload.email_verified === false) {
    return { ok: false, status: 401, message: "Verify your Google account email before using the add-on." };
  }

  return { ok: true, sub: String(payload.sub), email: String(payload.email || "") };
}

export function resetGoogleKeyCacheForTests() {
  keyCache = { keys: null, expiresAt: 0 };
}

async function googleSigningKeys(fetchImpl, now) {
  if (keyCache.keys && keyCache.expiresAt > now) return keyCache.keys;
  let response;
  try {
    response = await fetchImpl(GOOGLE_CERTS_URL);
  } catch {
    response = null;
  }
  if (!response?.ok) {
    keyCache = { keys: keyCache.keys || [], expiresAt: now + FAILED_FETCH_RETRY_SECONDS * 1000 };
    return keyCache.keys;
  }
  const body = await response.json().catch(() => ({}));
  const keys = Array.isArray(body.keys) ? body.keys : [];
  const maxAge = Number((response.headers.get("Cache-Control") || "").match(/max-age=(\d+)/)?.[1]);
  const ttlSeconds = Number.isFinite(maxAge) && maxAge > 0 ? maxAge : DEFAULT_KEY_CACHE_SECONDS;
  keyCache = { keys, expiresAt: now + ttlSeconds * 1000 };
  return keys;
}

async function verifyRs256(jwk, signedText, signature) {
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, new TextEncoder().encode(signedText));
  } catch {
    return false;
  }
}

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function base64UrlToString(value) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}
