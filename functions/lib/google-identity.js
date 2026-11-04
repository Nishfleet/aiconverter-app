import { createRemoteJWKSet, customFetch, errors, jwtVerify } from "jose";

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];
const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_AGE = "1h";

/** @type {ReturnType<typeof createRemoteJWKSet> | null}
 * Google's signing keys, fetched and cached by jose between requests.
 */
let googleKeys = null;

export const SHEETS_ADDON_CLIENT = "sheets-addon";

/** @param {Env} env
 * @returns {string[]}
 */
export function sheetsAddonClientIds(env) {
  return String(env?.GOOGLE_SHEETS_ADDON_CLIENT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** @param {Request} request
 * @returns {boolean}
 */
export function isSheetsAddonRequest(request) {
  return (request.headers.get("X-AIConverter-Client") || "").trim().toLowerCase() === SHEETS_ADDON_CLIENT;
}

/** @param {Request} request
 * @returns {string}
 */
export function bearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

/** @param {Env} env
 * @param {Request} request
 * @param {{ fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<{ ok: boolean, status?: number, message?: string, sub?: string, email?: string }>}
 * Verifies a Google-issued RS256 ID token against the add-on client ids
 * (audience), Google's issuers, expiry, and Google's published signing keys.
 */
export async function verifySheetsAddonIdentity(env, request, { fetchImpl = fetch } = {}) {
  const audiences = sheetsAddonClientIds(env);
  if (!audiences.length) {
    return { ok: false, status: 503, message: "The Google Sheets add-on is not enabled yet." };
  }

  const token = bearerToken(request);
  if (!token) return { ok: false, status: 401, message: "Sign in to Google Sheets again and retry." };

  let payload;
  try {
    ({ payload } = await jwtVerify(token, googleSigningKeys(fetchImpl), {
      algorithms: ["RS256"],
      issuer: GOOGLE_ISSUERS,
      audience: audiences,
      requiredClaims: ["exp", "sub"],
      maxTokenAge: MAX_TOKEN_AGE,
      clockTolerance: CLOCK_SKEW_SECONDS
    }));
  } catch (error) {
    const expired = error instanceof errors.JWTExpired || error instanceof errors.JWTClaimValidationFailed;
    return {
      ok: false,
      status: 401,
      message: expired
        ? "Your Google sign-in has expired. Reopen the add-on and retry."
        : "Your Google sign-in could not be verified."
    };
  }

  if (payload.email && payload.email_verified === false) {
    return { ok: false, status: 401, message: "Verify your Google account email before using the add-on." };
  }

  const verifiedEmail = payload.email_verified === true || payload.email_verified === "true";
  return { ok: true, sub: String(payload.sub), email: verifiedEmail ? String(payload.email || "") : "" };
}

/** @returns {void}
 */
export function resetGoogleKeyCacheForTests() {
  googleKeys = null;
}

/** @param {typeof fetch} fetchImpl
 * @returns {ReturnType<typeof createRemoteJWKSet>}
 * Google's signing keys through jose's remote JWKS cache. A failed refresh
 * throws, and the next call fetches again.
 */
function googleSigningKeys(fetchImpl) {
  googleKeys ??= createRemoteJWKSet(new URL(GOOGLE_CERTS_URL), { [customFetch]: fetchImpl });
  return googleKeys;
}
