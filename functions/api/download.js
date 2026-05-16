import { badRequest, json, methodNotAllowed, serverError, withSecurityHeaders } from "../lib/http.js";
import { getAuthorizedJob, hasRequiredBindings, outputFormatFromResultKey, updateJob } from "../lib/jobs.js";

export async function onRequestPost(context) {
  return handleDownload(context);
}

export function onRequestGet() {
  return methodNotAllowed("POST");
}

async function handleDownload({ request, env }) {
  if (!hasRequiredBindings(env)) {
    return serverError("Secure conversion storage is not configured yet.");
  }

  const credentials = await downloadCredentials(request);
  const job = await getAuthorizedJob(env, credentials.jobId, credentials.token);
  if (!job) return badRequest("Unknown or expired conversion.");
  if (job.status !== "complete") return badRequest("The conversion is not complete.");

  const freeDownloads = env.FREE_DOWNLOADS_ENABLED === "true";
  if (!job.paid_at && !freeDownloads) {
    return json({ error: "Payment is required before downloading the full file." }, { status: 402 });
  }

  const object = await env.AICONVERTER_BUCKET.get(job.result_key);
  if (!object) {
    await updateJob(env, job.id, {
      status: "expired",
      error: "The converted file has expired."
    }).catch(() => {});
    return badRequest("The converted file has expired.");
  }

  await updateJob(env, job.id, {
    download_count: Number(job.download_count || 0) + 1
  }).catch(() => {});

  return withSecurityHeaders(
    new Response(object.body, {
      headers: {
        "Content-Type": contentTypeForJob(job),
        "Content-Disposition": `attachment; filename="${downloadFileName(job)}"`,
        "Cache-Control": "no-store, private",
        "X-Robots-Tag": "noindex, noarchive, nosnippet"
      }
    })
  );
}

function downloadFileName(job) {
  const extension = outputFormatFromResultKey(job.result_key);
  const prefix =
    job.converter_id === "invoice"
      ? "invoice"
      : job.converter_id === "receipt"
      ? "receipt-expense"
      : job.converter_id === "screenshot"
        ? "screenshot-table"
        : "bank-statement";
  return `aiconverter-${prefix}.${extension}`;
}

function contentTypeForJob(job) {
  return outputFormatFromResultKey(job.result_key) === "json"
    ? "application/json; charset=utf-8"
    : "text/csv; charset=utf-8";
}

async function downloadCredentials(request) {
  const url = new URL(request.url);
  const authorization = request.headers.get("Authorization") || "";
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  const headerJobId = request.headers.get("X-AIConverter-Job-Id") || request.headers.get("X-Job-Id") || "";

  const body = await readDownloadBody(request);
  return {
    jobId: String(body.jobId || url.searchParams.get("jobId") || headerJobId || ""),
    token: String(body.token || bearerToken || "")
  };
}

async function readDownloadBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) return request.json().catch(() => ({}));
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    return Object.fromEntries((await request.formData()).entries());
  }
  return {};
}
