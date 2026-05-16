import { badRequest, json, methodNotAllowed, serverError } from "../lib/http.js";
import { refreshCloudConvertConversion } from "../lib/cloudconvert.js";
import { verifyDodoPayment } from "../lib/dodo.js";
import { CONVERTER_COLUMNS } from "../lib/extract.js";
import { getAuthorizedJob, hasRequiredBindings, outputFormatFromResultKey, parseStoredPreview, sourceAvailableForRedo, tokenFromBodyOrCookie } from "../lib/jobs.js";
import { isBinaryOutputFormat, isUniversalConverter, UNIVERSAL_COLUMNS } from "../lib/universal.js";

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
    return badRequest("Invalid job request.");
  }

  const jobId = String(body.jobId || "");
  const bodyToken = String(body.token || "");
  const token = tokenFromBodyOrCookie(request, jobId, bodyToken);
  let job = await getAuthorizedJob(env, jobId, token);
  if (!job) return badRequest("Unknown or expired conversion.");

  const paymentId = String(body.paymentId || body.payment_id || "");
  const paymentStatus = String(body.status || body.payment_status || "");
  if (!job.paid_at && paymentId && paymentStatus === "succeeded") {
    await verifyDodoPayment(env, paymentId, job);
    job = await getAuthorizedJob(env, jobId, token);
  }

  let providerResult = null;
  if (job.status === "converting_full" && isUniversalConverter(job.converter_id)) {
    providerResult = await refreshCloudConvertConversion(env, job);
    job = await getAuthorizedJob(env, jobId, token);
  }

  let previewRows = [];
  const resultFormat = outputFormatFromResultKey(job.result_key);
  const previewKey =
    job.status === "complete" && !isUniversalConverter(job.converter_id) && !isBinaryOutputFormat(resultFormat)
      ? job.result_key
      : job.preview_key;
  if (previewKey) {
    const object = await env.AICONVERTER_BUCKET.get(previewKey);
    if (object) {
      previewRows = parseStoredPreview(await object.text(), previewKey, 5);
    }
  }

  return json({
    status: job.status,
    jobId: job.id,
    token: bodyToken ? token : "",
    plan: job.plan_id,
    converterId: job.converter_id || "bank",
    outputFormat: outputFormatFromResultKey(job.result_key),
    columns: providerResult?.columns || columnsForPreview(job.converter_id || "bank", providerResult?.previewRows || previewRows),
    rowCount: job.row_count || 0,
    confidence: job.confidence || 0,
    previewRows: providerResult?.previewRows || previewRows,
    paid: Boolean(job.paid_at),
    redoAvailable: Boolean(job.paid_at) && !isUniversalConverter(job.converter_id) && job.status === "complete" && Number(job.redo_count || 0) < 1 && sourceAvailableForRedo(job),
    refundStatus: job.refund_status || "",
    message: providerResult?.message || job.error || ""
  });
}

function columnsForPreview(converterId, previewRows) {
  if (previewRows.length) {
    return Object.keys(previewRows[0]).slice(0, 8).map((key) => ({
      key,
      label: labelForKey(key)
    }));
  }
  if (isUniversalConverter(converterId)) return UNIVERSAL_COLUMNS;
  return CONVERTER_COLUMNS[converterId] || CONVERTER_COLUMNS.bank;
}

function labelForKey(key) {
  return String(key)
    .replace(/^column_(\d+)$/i, "Column $1")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
