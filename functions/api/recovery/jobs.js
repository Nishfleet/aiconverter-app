import { badRequest, json, methodNotAllowed, serverError } from "../../lib/http.js";
import { hasRequiredBindings } from "../../lib/jobs.js";
import { recoverJobsForToken } from "../../lib/recovery.js";

export function onRequestGet() {
  return methodNotAllowed("POST");
}

export async function onRequestPost({ request, env }) {
  if (!hasRequiredBindings(env)) return serverError("Secure recovery storage is not configured yet.");

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid recovery request.");
  }

  const result = await recoverJobsForToken(env, body.token || body.recoveryToken);
  if (!result.ok) return json({ error: result.message }, { status: result.status });
  return json({ ok: true, jobs: result.jobs, supportCases: result.supportCases });
}
