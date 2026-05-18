import { badRequest, json, methodNotAllowed, serverError } from "../lib/http.js";
import {
  clearJobAccessCookie,
  deleteJobData,
  getAuthorizedJob,
  hasRequiredBindings,
  retentionFields,
  tokenFromBodyOrCookie,
  tokenFromJobCookie
} from "../lib/jobs.js";

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
    return badRequest("Invalid delete request.");
  }

  const jobId = String(body.jobId || "");
  const bodyToken = String(body.token || "");
  const token = tokenFromBodyOrCookie(request, jobId, bodyToken);
  const job = await getAuthorizedJob(env, jobId, token);
  if (!job) return badRequest("Unknown or expired conversion.");

  const deletedJob = await deleteJobData(env, job);
  const headers = tokenFromJobCookie(request, jobId) ? { "Set-Cookie": clearJobAccessCookie() } : {};

  return json(
    {
      status: "deleted",
      jobId: deletedJob.id,
      ...retentionFields(deletedJob),
      message: "This conversion and its stored files were deleted."
    },
    { headers }
  );
}
