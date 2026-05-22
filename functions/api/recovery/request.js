import { badRequest, json, methodNotAllowed, serverError } from "../../lib/http.js";
import { hasRequiredBindings } from "../../lib/jobs.js";
import { createRecoveryRequest } from "../../lib/recovery.js";

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

  const result = await createRecoveryRequest({ env, request, email: body.email });
  if (!result.ok) return json({ error: result.message }, { status: result.status });

  return json({
    ok: true,
    status: result.emailStatus === "sent" ? "sent" : "queued",
    emailHint: result.emailHint,
    message: "If recent jobs match that email, a recovery link will be sent.",
    expiresAt: result.expiresAt,
    ...(result.recoveryToken ? { recoveryToken: result.recoveryToken } : {})
  });
}
