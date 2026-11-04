/** @param {Env} env
 * @returns {boolean}
 */
export function hasTurnstile(env) {
  return Boolean(env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
}

/** @param {Env} env
 * @param {Request} request
 * @param {unknown} token
 * @returns {Promise<{ ok: boolean, skipped: boolean, message: string, errors?: string[] }>}
 * Verifies a Turnstile token with Cloudflare's siteverify endpoint when the
 * keys are configured; returns ok:true/skipped:true when they are not.
 */
export async function verifyTurnstile(env, request, token) {
  if (!hasTurnstile(env)) return { ok: true, skipped: true, message: "" };

  const responseToken = String(token || "").trim();
  if (!responseToken) {
    return { ok: false, skipped: false, message: "Complete the human check before continuing." };
  }

  const remoteip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "";

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: responseToken,
      remoteip,
      idempotency_key: crypto.randomUUID()
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (payload.success) return { ok: true, skipped: false, message: "" };

  return {
    ok: false,
    skipped: false,
    message: "The human check failed or expired. Refresh it and try again.",
    errors: payload["error-codes"] || []
  };
}
