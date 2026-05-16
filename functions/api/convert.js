import { convertFileToCsv, detectPdfPageCount } from "../lib/extract.js";
import { badRequest, json, methodNotAllowed, serverError } from "../lib/http.js";
import { verifyTurnstile } from "../lib/turnstile.js";
import {
  assertSupportedUpload,
  enforceRateLimit,
  enforceUploadPolicy,
  estimatePdfPagesFromBytes,
  hasRequiredBindings,
  insertJob,
  MAX_PAGE_COUNT,
  normalizeConverterId,
  normalizeOutputFormat,
  planForPages,
  PREVIEW_PAGE_LIMIT,
  randomId,
  randomToken,
  requestFingerprint,
  RESULT_RETENTION_SECONDS,
  safeFileName,
  sourceObjectKey,
  SOURCE_RETENTION_SECONDS,
  sha256,
  sha256Bytes,
  updateJob
} from "../lib/jobs.js";

export function onRequestGet() {
  return methodNotAllowed("POST");
}

export async function onRequestPost({ request, env }) {
  if (!hasRequiredBindings(env)) {
    return serverError("Secure conversion storage is not configured yet.");
  }

  const rateLimit = await enforceRateLimit(env, request);
  if (rateLimit.configurationError) {
    return serverError("Private abuse-prevention salt is not configured yet.");
  }

  if (!rateLimit.ok) {
    return json(
      { error: `Too many uploads from this connection. Try again later.` },
      {
        status: 429,
        headers: { "Retry-After": "3600" }
      }
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Upload a supported file using multipart form data.");
  }

  const converterId = normalizeConverterId(form.get("converterId"));
  const outputFormat = normalizeOutputFormat(form.get("outputFormat"), converterId);
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("Choose a file first.");

  const turnstile = await verifyTurnstile(
    env,
    request,
    form.get("cf-turnstile-response") || form.get("turnstileToken")
  );
  if (!turnstile.ok) return json({ error: turnstile.message }, { status: 403 });

  const email = String(form.get("email") || "").trim().slice(0, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Use a valid email address or leave it blank.");
  }

  const fileName = safeFileName(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const uploadError = assertSupportedUpload(file, arrayBuffer, converterId);
  if (uploadError) return badRequest(uploadError);

  const clientEstimate = Number(form.get("estimatedPages") || 25);
  const clientEstimatedPages = Number.isFinite(clientEstimate) ? Math.max(1, clientEstimate) : 25;
  const isPdf = String(file.type || "").toLowerCase() === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const detectedPages = isPdf
    ? (await detectPdfPageCount(arrayBuffer).catch(() => 0)) || estimatePdfPagesFromBytes(arrayBuffer)
    : 1;
  const sizeEstimatedPages = Math.ceil(file.size / 320000);
  const estimatedPages = isPdf
    ? Math.max(1, clientEstimatedPages, detectedPages, sizeEstimatedPages)
    : 1;
  if (estimatedPages > MAX_PAGE_COUNT) {
    return badRequest(`This service accepts PDFs up to ${MAX_PAGE_COUNT} pages. Split larger files before uploading.`);
  }
  const plan = planForPages(estimatedPages);
  const fileHash = await sha256Bytes(arrayBuffer);
  const fingerprint = await requestFingerprint(env, request);
  const uploadPolicy = await enforceUploadPolicy(env, { ...fingerprint, fileHash });
  if (!uploadPolicy.ok) return json({ error: uploadPolicy.message }, { status: 429 });

  const jobId = randomId("job");
  const token = randomToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + RESULT_RETENTION_SECONDS * 1000).toISOString();
  const sourceExpiresAt = new Date(Date.now() + SOURCE_RETENTION_SECONDS * 1000).toISOString();
  const sourceKey = sourceObjectKey(jobId, fileName, converterId);
  const previewKey = `jobs/${jobId}/preview.csv`;
  const resultKey = `jobs/${jobId}/result.${outputFormat}`;

  await insertJob(env, {
    id: jobId,
    tokenHash: await sha256(token),
    status: "processing",
    planId: plan.id,
    email,
    sourceKey,
    resultKey,
    originalFileName: fileName,
    fileSize: file.size,
    estimatedPages,
    converterId,
    inputMimeType: file.type || (isPdf ? "application/pdf" : "application/octet-stream"),
    fileHash,
    ipHash: fingerprint.ipHash,
    userAgentHash: fingerprint.userAgentHash,
    now,
    expiresAt
  });

  try {
    await env.AICONVERTER_BUCKET.put(sourceKey, arrayBuffer, {
      httpMetadata: { contentType: file.type || (isPdf ? "application/pdf" : "application/octet-stream") },
      customMetadata: {
        jobId,
        purpose: "source-awaiting-payment",
        deleteAfter: sourceExpiresAt
      }
    });

    const converted = await convertFileToCsv(env, converterId, fileName, file.type || (isPdf ? "application/pdf" : ""), arrayBuffer, {
      previewPages: PREVIEW_PAGE_LIMIT,
      estimatedPages,
      outputFormat
    });

    if (!converted.ok) {
      await env.AICONVERTER_BUCKET.delete(sourceKey).catch(() => {});
      await updateJob(env, jobId, {
        status: "failed",
        error: converted.message,
        confidence: converted.confidence || 0,
        row_count: converted.rowCount || 0,
        source_deleted_at: new Date().toISOString(),
        extractor: converted.provider || ""
      });

      return json({
        status: "failed",
        jobId,
        token,
        message: converted.message,
        confidence: converted.confidence || 0,
        rowCount: converted.rowCount || 0,
        columns: converted.columns || [],
        converterId,
        outputFormat,
        plan
      });
    }

    await env.AICONVERTER_BUCKET.put(previewKey, converted.csv, {
      httpMetadata: { contentType: "text/csv; charset=utf-8" },
      customMetadata: {
        jobId,
        purpose: "preview-csv",
        deleteAfter: expiresAt
      }
    });

    await updateJob(env, jobId, {
      status: "preview_ready",
      preview_key: previewKey,
      confidence: converted.confidence,
      row_count: converted.rowCount,
      extractor: converted.provider || ""
    });

    return json({
      status: "preview_ready",
      jobId,
      token,
      plan,
      converterId,
      outputFormat,
      columns: converted.columns || [],
      previewRows: converted.previewRows,
      confidence: converted.confidence,
      rowCount: converted.rowCount,
      message: `Preview ready. Pay once to run the full extraction and download the ${outputFormatLabel(outputFormat)}.`
    });
  } catch (error) {
    await env.AICONVERTER_BUCKET.delete(sourceKey).catch(() => {});
    await updateJob(env, jobId, {
      status: "failed",
      error: "The converter could not safely process this file.",
      source_deleted_at: new Date().toISOString()
    });

    return json(
      {
        status: "failed",
        jobId,
        token,
        plan,
        message: error?.message || "The converter could not safely process this file.",
        confidence: 0,
        rowCount: 0
      },
      { status: 200 }
    );
  }
}

function outputFormatLabel(format) {
  const labels = {
    csv: "CSV",
    json: "JSON",
    txt: "TXT transcript",
    md: "Markdown",
    html: "HTML",
    pdf: "PDF",
    docx: "DOCX",
    xlsx: "XLSX",
    pptx: "PPTX",
    png: "PNG",
    jpg: "JPG",
    webp: "WEBP",
    gif: "GIF",
    svg: "SVG",
    mp3: "MP3",
    wav: "WAV",
    m4a: "M4A",
    ogg: "OGG",
    flac: "FLAC",
    mp4: "MP4",
    webm: "WEBM",
    mov: "MOV",
    zip: "ZIP",
    "7z": "7Z",
    tar: "TAR"
  };
  return labels[format] || "converted file";
}
