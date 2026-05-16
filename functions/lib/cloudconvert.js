import { requestDodoRefund } from "./dodo.js";
import { outputFormatFromResultKey, updateJob } from "./jobs.js";
import {
  cloudConvertInputFormat,
  cloudConvertOutputFormat,
  contentTypeForOutputFormat,
  UNIVERSAL_COLUMNS,
  universalOutputLabel,
  universalPreviewRow
} from "./universal.js";

const CLOUDCONVERT_API_BASE = "https://api.cloudconvert.com/v2";
const DEFAULT_TASK_TIMEOUT_SECONDS = 900;

export function hasCloudConvertConfig(env) {
  return Boolean(String(env.CLOUDCONVERT_API_KEY || "").trim());
}

export async function startCloudConvertConversion(env, job, arrayBuffer) {
  if (!hasCloudConvertConfig(env)) {
    return {
      ok: false,
      message: "Universal file conversion needs the CloudConvert API key before it can run.",
      confidence: 0,
      rowCount: 0,
      provider: "cloudconvert"
    };
  }

  if (job.external_job_id) {
    return pendingResult(job);
  }

  const outputFormat = outputFormatFromResultKey(job.result_key);
  const inputFormat = cloudConvertInputFormat(job.original_file_name || "");
  const timeout = Math.max(
    60,
    Math.min(7200, Number(env.CLOUDCONVERT_TASK_TIMEOUT_SECONDS || DEFAULT_TASK_TIMEOUT_SECONDS))
  );
  const tasks = {
    "upload-source": {
      operation: "import/upload"
    },
    "convert-file": {
      operation: "convert",
      input: "upload-source",
      output_format: cloudConvertOutputFormat(outputFormat),
      timeout
    },
    "export-result": {
      operation: "export/url",
      input: "convert-file",
      inline: false,
      archive_multiple_files: false
    }
  };
  if (inputFormat) tasks["convert-file"].input_format = inputFormat;

  const cloudJob = await cloudConvertRequest(env, "/jobs", {
    method: "POST",
    body: JSON.stringify({
      tasks,
      tag: job.id
    })
  });
  const uploadTask = findTask(cloudJob, "import/upload");
  const form = uploadTask?.result?.form;
  if (!form?.url || !form.parameters) {
    throw new Error("CloudConvert did not return an upload form.");
  }

  await uploadCloudConvertFile(form, arrayBuffer, job.original_file_name || "source.bin", job.input_mime_type || "");

  await updateJob(env, job.id, {
    status: "converting_full",
    extractor: "cloudconvert",
    external_provider: "cloudconvert",
    external_job_id: cloudJob.id || "",
    external_task_id: uploadTask.id || "",
    external_status: cloudJob.status || "processing",
    external_updated_at: new Date().toISOString()
  });

  return pendingResult({
    ...job,
    external_job_id: cloudJob.id || "",
    external_status: cloudJob.status || "processing"
  });
}

export async function refreshCloudConvertConversion(env, job) {
  if (!job?.external_job_id) return { ok: false, message: "No provider job is attached to this conversion." };
  if (!hasCloudConvertConfig(env)) {
    return failCloudConvertJob(env, job, "CloudConvert API key is missing while a paid conversion is pending.");
  }

  const cloudJob = await cloudConvertRequest(env, `/jobs/${encodeURIComponent(job.external_job_id)}`);
  await updateJob(env, job.id, {
    external_status: cloudJob.status || "",
    external_updated_at: new Date().toISOString()
  }).catch(() => {});

  if (["waiting", "processing"].includes(cloudJob.status)) return pendingResult(job, cloudJob.status);
  if (cloudJob.status !== "finished") {
    return failCloudConvertJob(env, job, cloudConvertErrorMessage(cloudJob));
  }

  const exportTask = findTask(cloudJob, "export/url");
  const resultFile = exportTask?.result?.files?.[0];
  if (!resultFile?.url) {
    return failCloudConvertJob(env, job, "CloudConvert finished without an exported file.");
  }

  const fileResponse = await fetch(resultFile.url);
  if (!fileResponse.ok) {
    return failCloudConvertJob(env, job, `CloudConvert export download failed (${fileResponse.status}).`);
  }

  const outputFormat = outputFormatFromResultKey(job.result_key);
  const contentType = fileResponse.headers.get("Content-Type") || contentTypeForOutputFormat(outputFormat);
  const resultBuffer = await fileResponse.arrayBuffer();

  await env.AICONVERTER_BUCKET.put(job.result_key, resultBuffer, {
    httpMetadata: { contentType },
    customMetadata: {
      jobId: job.id,
      purpose: `result-${outputFormat}`,
      provider: "cloudconvert",
      deleteAfter: job.expires_at
    }
  });

  const row = {
    ...universalPreviewRow(job.original_file_name || "source", job.input_mime_type || "", outputFormat),
    status: "Ready to download"
  };

  await updateJob(env, job.id, {
    status: "complete",
    confidence: 0.92,
    row_count: 1,
    completed_at: new Date().toISOString(),
    extractor: "cloudconvert",
    external_status: "finished",
    external_result_name: resultFile.filename || "",
    external_result_url: "",
    external_updated_at: new Date().toISOString()
  });

  return {
    ok: true,
    status: "complete",
    previewRows: [row],
    columns: UNIVERSAL_COLUMNS,
    confidence: 0.92,
    rowCount: 1,
    outputFormat,
    provider: "cloudconvert"
  };
}

export async function failCloudConvertJob(env, job, message) {
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

function pendingResult(job, status = "processing") {
  const outputFormat = outputFormatFromResultKey(job.result_key);
  return {
    ok: true,
    pending: true,
    status: "converting_full",
    previewRows: [
      {
        ...universalPreviewRow(job.original_file_name || "source", job.input_mime_type || "", outputFormat),
        status: status === "waiting" ? "Queued" : "Converting"
      }
    ],
    columns: UNIVERSAL_COLUMNS,
    confidence: 0.9,
    rowCount: 1,
    outputFormat,
    provider: "cloudconvert",
    message: `${universalOutputLabel(outputFormat)} conversion is running. This page will update automatically.`
  };
}

async function cloudConvertRequest(env, path, init = {}) {
  const response = await fetch(`${CLOUDCONVERT_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CLOUDCONVERT_API_KEY}`,
      ...(init.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const detail = payload?.message || payload?.errors?.[0]?.message || `CloudConvert request failed (${response.status}).`;
    throw new Error(detail);
  }
  return payload.data || payload;
}

async function uploadCloudConvertFile(form, arrayBuffer, fileName, contentType) {
  const body = new FormData();
  for (const [key, value] of Object.entries(form.parameters || {})) {
    body.append(key, String(value));
  }
  body.append(
    "file",
    new Blob([arrayBuffer], { type: contentType || "application/octet-stream" }),
    fileName
  );

  const response = await fetch(form.url, {
    method: "POST",
    body
  });
  if (!response.ok) throw new Error(`CloudConvert upload failed (${response.status}).`);
}

function findTask(job, operation) {
  return (job.tasks || []).find((task) => task.operation === operation);
}

function cloudConvertErrorMessage(job) {
  const failed = (job.tasks || []).find((task) => task.status === "error" || task.message || task.code);
  return failed?.message || failed?.code || "CloudConvert could not complete this conversion.";
}
