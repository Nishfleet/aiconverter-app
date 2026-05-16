import { requestDodoRefund } from "./dodo.js";
import { outputFormatFromResultKey, updateJob } from "./jobs.js";
import {
  contentTypeForOutputFormat,
  UNIVERSAL_COLUMNS,
  universalOutputLabel,
  universalPreviewRow
} from "./universal.js";

const ZAMZAR_LIVE_URL = "https://api.zamzar.com/v1";
const ZAMZAR_SANDBOX_URL = "https://sandbox.zamzar.com/v1";
const DEFAULT_DAILY_JOB_LIMIT = 5;

export function hasZamzarConfig(env) {
  return Boolean(String(env.ZAMZAR_API_KEY || "").trim());
}

export function zamzarDailyJobLimit(env) {
  return boundedNumber(env.ZAMZAR_DAILY_JOB_LIMIT, DEFAULT_DAILY_JOB_LIMIT, 0, 10000);
}

export async function startZamzarConversion(env, job, arrayBuffer) {
  if (!hasZamzarConfig(env)) {
    return {
      ok: false,
      message: "Zamzar backup conversion needs the ZAMZAR_API_KEY secret before it can run.",
      confidence: 0,
      rowCount: 0,
      provider: "zamzar"
    };
  }

  const limit = zamzarDailyJobLimit(env);
  const reservation = await reserveZamzarDailySlot(env, limit);
  if (!reservation.ok) {
    return {
      ok: false,
      message: reservation.message,
      confidence: 0,
      rowCount: 0,
      provider: "zamzar"
    };
  }

  const outputFormat = outputFormatFromResultKey(job.result_key);
  const body = new FormData();
  body.append("target_format", outputFormat);
  body.append(
    "source_file",
    new Blob([arrayBuffer], { type: job.input_mime_type || "application/octet-stream" }),
    job.original_file_name || "source.bin"
  );

  const providerJob = await zamzarRequest(env, "/jobs", {
    method: "POST",
    body
  });
  if (!providerJob?.id) throw new Error("Zamzar did not return a job ID.");

  await updateJob(env, job.id, {
    status: "converting_full",
    extractor: "zamzar",
    external_provider: "zamzar",
    external_job_id: String(providerJob.id),
    external_task_id: providerJob.source_file?.id ? String(providerJob.source_file.id) : "",
    external_status: providerJob.status || "initialising",
    external_updated_at: new Date().toISOString()
  });

  return pendingResult({
    ...job,
    external_provider: "zamzar",
    external_job_id: String(providerJob.id),
    external_status: providerJob.status || "initialising"
  });
}

export async function refreshZamzarConversion(env, job) {
  if (!job?.external_job_id) return { ok: false, message: "No backup provider job is attached to this conversion." };
  if (!hasZamzarConfig(env)) {
    return failZamzarJob(env, job, "Zamzar API key is missing while a backup conversion is pending.");
  }

  const providerJob = await zamzarRequest(env, `/jobs/${encodeURIComponent(job.external_job_id)}`);
  await updateJob(env, job.id, {
    external_status: providerJob.status || "",
    external_updated_at: new Date().toISOString()
  }).catch(() => {});

  if (!["successful", "failed", "cancelled"].includes(String(providerJob.status || ""))) {
    return pendingResult(job, providerJob.status || "converting");
  }
  if (providerJob.status !== "successful") {
    return failZamzarJob(env, job, providerJob.failure_message || providerJob.message || "Zamzar could not complete this conversion.");
  }

  const target = providerJob.target_files?.[0];
  if (!target?.id) return failZamzarJob(env, job, "Zamzar finished without an exported file.");

  const fileResponse = await zamzarRawRequest(env, `/files/${encodeURIComponent(target.id)}/content`, { method: "GET" });
  if (!fileResponse.ok) {
    return failZamzarJob(env, job, `Zamzar export download failed (${fileResponse.status}).`);
  }

  const outputFormat = outputFormatFromResultKey(job.result_key);
  const contentType = fileResponse.headers.get("Content-Type") || contentTypeForOutputFormat(outputFormat);
  const resultBuffer = await fileResponse.arrayBuffer();

  await env.AICONVERTER_BUCKET.put(job.result_key, resultBuffer, {
    httpMetadata: { contentType },
    customMetadata: {
      jobId: job.id,
      purpose: `result-${outputFormat}`,
      provider: "zamzar",
      deleteAfter: job.expires_at
    }
  });

  const row = {
    ...universalPreviewRow(job.original_file_name || "source", job.input_mime_type || "", outputFormat, "Zamzar"),
    status: "Ready to download"
  };

  await updateJob(env, job.id, {
    status: "complete",
    confidence: 0.9,
    row_count: 1,
    completed_at: new Date().toISOString(),
    extractor: "zamzar",
    external_status: "successful",
    external_result_name: target.name || "",
    external_result_url: "",
    external_updated_at: new Date().toISOString()
  });

  return {
    ok: true,
    status: "complete",
    previewRows: [row],
    columns: UNIVERSAL_COLUMNS,
    confidence: 0.9,
    rowCount: 1,
    outputFormat,
    provider: "zamzar"
  };
}

async function failZamzarJob(env, job, message) {
  await env.AICONVERTER_BUCKET.delete(job.source_key).catch(() => {});
  const refund = job.paid_at
    ? await requestDodoRefund(env, job, message, { cashRefund: Number(job.download_count || 0) === 0 })
    : { status: "", refundId: "" };
  await updateJob(env, job.id, {
    status: "failed",
    error: message,
    confidence: 0,
    row_count: 0,
    source_deleted_at: new Date().toISOString(),
    refund_status: refund.status || job.refund_status || "",
    refund_id: refund.refundId || job.refund_id || "",
    external_status: "failed",
    external_updated_at: new Date().toISOString()
  });
  return {
    ok: false,
    status: "failed",
    message,
    confidence: 0,
    rowCount: 0,
    refundStatus: refund.status || ""
  };
}

function pendingResult(job, status = "converting") {
  const outputFormat = outputFormatFromResultKey(job.result_key);
  return {
    ok: true,
    pending: true,
    status: "converting_full",
    previewRows: [
      {
        ...universalPreviewRow(job.original_file_name || "source", job.input_mime_type || "", outputFormat, "Zamzar"),
        status: status === "initialising" ? "Queued" : "Converting"
      }
    ],
    columns: UNIVERSAL_COLUMNS,
    confidence: 0.88,
    rowCount: 1,
    outputFormat,
    provider: "zamzar",
    message: `${universalOutputLabel(outputFormat)} conversion is running on the backup route. This page will update automatically.`
  };
}

async function reserveZamzarDailySlot(env, limit) {
  if (limit <= 0) return { ok: true, count: 0, remainingToday: null };
  const windowStart = startOfUtcDay();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.parse(windowStart) + 48 * 60 * 60 * 1000).toISOString();
  const id = `zamzar:daily:${windowStart.slice(0, 10)}`;

  try {
    const row = await env.AICONVERTER_DB.prepare(
      `INSERT INTO rate_limits (id, window_start, count, expires_at, updated_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET count = count + 1, expires_at = ?, updated_at = ?
       WHERE count < ?
       RETURNING count`
    )
      .bind(id, windowStart, expiresAt, now, expiresAt, now, limit)
      .first();

    if (row?.count) {
      const count = numberOrZero(row.count);
      return { ok: true, count, remainingToday: Math.max(0, limit - count) };
    }

    const current = await env.AICONVERTER_DB.prepare("SELECT count FROM rate_limits WHERE id = ?").bind(id).first();
    const count = numberOrZero(current?.count);
    return {
      ok: false,
      count,
      remainingToday: 0,
      message: `Zamzar daily backup cap reached (${count}/${limit}).`
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      remainingToday: 0,
      message: `Zamzar daily backup cap reservation failed: ${error?.message || "unknown error"}`
    };
  }
}

async function zamzarRequest(env, path, init = {}) {
  const response = await zamzarRawRequest(env, path, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || payload?.message || `Zamzar request failed (${response.status}).`);
  }
  return payload;
}

async function zamzarRawRequest(env, path, init = {}) {
  return fetch(`${zamzarBaseUrl(env)}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${basicAuthToken(env.ZAMZAR_API_KEY)}`,
      ...(init.headers || {})
    }
  });
}

function zamzarBaseUrl(env) {
  return String(env.ZAMZAR_SANDBOX || "").toLowerCase() === "true" ? ZAMZAR_SANDBOX_URL : ZAMZAR_LIVE_URL;
}

function basicAuthToken(apiKey) {
  return btoa(`${String(apiKey || "")}:`);
}

function boundedNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}
