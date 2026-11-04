const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; form-action 'self' https://*.dodopayments.com; frame-ancestors 'none'; object-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; upgrade-insecure-requests",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};

/** @param {Response} response
 * @param {Record<string, string>} [extra]
 * @returns {Response}
 * Wraps a Response with the site security headers; extra wins per header.
 */
export function withSecurityHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Methods");
  headers.delete("Access-Control-Allow-Headers");
  Object.entries({ ...securityHeaders, ...extra }).forEach(([key, value]) => {
    if (value) headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/** @param {unknown} body
 * @param {ResponseInit} [init]
 * @returns {Response}
 */
export function json(body, init = {}) {
  return withSecurityHeaders(
    new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(init.headers || {})
      }
    })
  );
}

/** @param {string} [methods]
 * @returns {Response}
 */
export function methodNotAllowed(methods = "POST") {
  return json(
    { error: `Method not allowed. Use ${methods}.` },
    {
      status: 405,
      headers: { Allow: methods }
    }
  );
}

/** @param {string} message
 * @returns {Response}
 */
export function badRequest(message) {
  return json({ error: message }, { status: 400 });
}

/** @param {string} [message]
 * @returns {Response}
 */
export function serverError(message = "The converter is not ready yet.") {
  return json({ error: message }, { status: 500 });
}
