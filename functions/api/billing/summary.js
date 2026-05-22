import { badRequest, json, methodNotAllowed, serverError } from "../../lib/http.js";
import { authorizedBillingSummary } from "../../lib/billing-summary.js";
import { hasRequiredBindings } from "../../lib/jobs.js";

export function onRequestGet() {
  return methodNotAllowed("POST");
}

export async function onRequestPost({ request, env }) {
  if (!hasRequiredBindings(env)) return serverError("Secure billing storage is not configured yet.");

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid billing request.");
  }

  const billing = await authorizedBillingSummary({ env, request, body });
  if (!billing) return badRequest("Unknown or expired conversion.");
  return json({ ok: true, billing });
}
