import { json } from "./http.js";

/** @param {Request} request
 * @param {Env} env
 * @returns {{ ok: boolean, status: number, message: string }}
 * Constant-time admin token check. Returns ok:false with a status and a
 * customer-facing message; requireAdmin turns that into a Response.
 */
export function authorizeAdmin(request, env) {
  const expected = String(env.ADMIN_TOKEN || "").trim();
  if (expected.length < 24) {
    return { ok: false, status: 503, message: "Admin token is not configured." };
  }

  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  const supplied = String(bearer || request.headers.get("X-Admin-Token") || "").trim();

  return timingSafeEqual(supplied, expected)
    ? { ok: true, status: 200, message: "" }
    : { ok: false, status: 401, message: "Unauthorized." };
}

/** @param {Request} request
 * @param {Env} env
 * @returns {Response | null}
 */
export function requireAdmin(request, env) {
  const auth = authorizeAdmin(request, env);
  return auth.ok ? null : json({ error: auth.message }, { status: auth.status });
}

/** @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
