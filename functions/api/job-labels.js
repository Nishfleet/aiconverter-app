import { badRequest, json, methodNotAllowed, serverError } from "../lib/http.js";
import { getAuthorizedJob, hasRequiredBindings, tokenFromBodyOrCookie, updateJob } from "../lib/jobs.js";
import { jobLabelFields, sanitizeJobLabels } from "../lib/job-labels.js";

export function onRequestGet() {
  return methodNotAllowed("POST");
}

export async function onRequestPost({ request, env }) {
  if (!hasRequiredBindings(env)) {
    return serverError("Secure conversion storage is not configured yet.");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid label update request.");
  }

  const jobId = String(body.jobId || "");
  const bodyToken = String(body.token || "");
  const token = tokenFromBodyOrCookie(request, jobId, bodyToken);
  const job = await getAuthorizedJob(env, jobId, token);
  if (!job) return badRequest("Unknown or expired conversion.");

  const labels = sanitizeJobLabels(body);
  await updateJob(env, job.id, jobLabelFields(labels));

  return json({
    ok: true,
    jobId: job.id,
    labels
  });
}
