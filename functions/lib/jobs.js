export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_PAGE_COUNT = 500;
export const PREVIEW_PAGE_LIMIT = 3;
export const SOURCE_RETENTION_SECONDS = 24 * 60 * 60;
export const RESULT_RETENTION_SECONDS = 7 * 24 * 60 * 60;
export const DEFAULT_CSV_COLUMNS = ["date", "description", "money_in", "money_out", "balance", "page", "confidence"];

const MIN_RATE_LIMIT_SALT_LENGTH = 24;
const BLOCKED_RATE_LIMIT_SALTS = new Set(["aiconverter", "change-me", "changeme", "secret", "password"]);

let runtimeRateLimitSalt = "";

export const PLANS = {
  starter: { id: "starter", name: "Starter", price: "$3", amount: 300, pages: 25 },
  batch: { id: "batch", name: "Standard", price: "$5", amount: 500, pages: 100 },
  pro: { id: "pro", name: "Bulk", price: "$9", amount: 900, pages: 500 }
};

export function planForPages(pages) {
  const normalized = Number.isFinite(pages) ? pages : 25;
  if (normalized <= 25) return PLANS.starter;
  if (normalized <= 100) return PLANS.batch;
  return PLANS.pro;
}

export function sourceAvailableForRedo(job) {
  if (!job || job.source_deleted_at) return false;
  const createdAt = Date.parse(job.created_at || "");
  if (!Number.isFinite(createdAt)) return true;
  return Date.now() - createdAt < SOURCE_RETENTION_SECONDS * 1000;
}

export function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return digestToHex(digest);
}

export async function sha256Bytes(arrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return digestToHex(digest);
}

function digestToHex(digest) {
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function safeFileName(name = "statement.pdf") {
  const base = String(name).split(/[\\/]/).pop() || "statement.pdf";
  return base.replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 80) || "statement.pdf";
}

export function hasRequiredBindings(env) {
  return Boolean(env.AICONVERTER_BUCKET && env.AICONVERTER_DB);
}

export function hasExtractorBinding(env) {
  return Boolean(hasMistralConfig(env) || hasAzureConfig(env) || env.AI);
}

export function hasMistralConfig(env) {
  return Boolean(env.MISTRAL_API_KEY);
}

export function hasAzureConfig(env) {
  return Boolean(
    env.ENABLE_AZURE_FALLBACK === "true" &&
      env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT &&
      env.AZURE_DOCUMENT_INTELLIGENCE_KEY
  );
}

export function rateLimitSaltStatus(env) {
  const configured = String(env.RATE_LIMIT_SALT || "").trim();
  const normalized = configured.toLowerCase();
  if (
    configured.length >= MIN_RATE_LIMIT_SALT_LENGTH &&
    !BLOCKED_RATE_LIMIT_SALTS.has(normalized)
  ) {
    return { ok: true, salt: configured, warning: "" };
  }

  if (env.ALLOW_RUNTIME_RATE_LIMIT_SALT === "true") {
    if (!runtimeRateLimitSalt) runtimeRateLimitSalt = crypto.randomUUID();
    console.warn(
      "AIConverter RATE_LIMIT_SALT is missing or weak; using a runtime-only fallback. Configure RATE_LIMIT_SALT before production traffic."
    );
    return {
      ok: true,
      salt: runtimeRateLimitSalt,
      warning: "RATE_LIMIT_SALT is missing or weak; using a runtime-only fallback."
    };
  }

  return {
    ok: false,
    salt: "",
    warning: "RATE_LIMIT_SALT must be configured as a long random secret before uploads are enabled."
  };
}

export async function assertPdf(file, arrayBuffer) {
  if (!file) return "Choose a PDF file first.";
  if (file.size <= 0) return "The PDF is empty.";
  if (file.size > MAX_FILE_BYTES) return "This service accepts PDFs up to 50 MB.";

  const fileName = safeFileName(file.name);
  const looksLikePdfName = fileName.toLowerCase().endsWith(".pdf");
  const looksLikePdfType = !file.type || file.type === "application/pdf" || file.type === "application/octet-stream";
  if (!looksLikePdfName || !looksLikePdfType) return "Only bank statement PDFs are supported right now.";

  const signature = new TextDecoder().decode(arrayBuffer.slice(0, 5));
  if (signature !== "%PDF-") return "That file does not look like a valid PDF.";

  return "";
}

export function supportedConverters() {
  return {
    bank: {
      id: "bank",
      label: "Bank statement",
      sourcePrefix: "source",
      acceptedTypes: ["application/pdf"],
      acceptedExtensions: [".pdf"]
    },
    receipt: {
      id: "receipt",
      label: "Receipt",
      sourcePrefix: "receipt",
      acceptedTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
      acceptedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".webp"]
    },
    screenshot: {
      id: "screenshot",
      label: "Screenshot table",
      sourcePrefix: "screenshot",
      acceptedTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
      acceptedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".webp"]
    }
  };
}

export function normalizeConverterId(value) {
  const id = String(value || "bank").trim().toLowerCase();
  return supportedConverters()[id] ? id : "bank";
}

export function assertSupportedUpload(file, arrayBuffer, converterId = "bank") {
  const converter = supportedConverters()[normalizeConverterId(converterId)];
  if (!file) return "Choose a file first.";
  if (file.size <= 0) return "The file is empty.";
  if (file.size > MAX_FILE_BYTES) return "This service accepts files up to 50 MB.";

  const fileName = safeFileName(file.name).toLowerCase();
  const fileType = String(file.type || "application/octet-stream").toLowerCase();
  const hasAcceptedExtension = converter.acceptedExtensions.some((extension) => fileName.endsWith(extension));
  const hasAcceptedType =
    converter.acceptedTypes.includes(fileType) ||
    (!file.type && converter.acceptedExtensions.some((extension) => fileName.endsWith(extension))) ||
    fileType === "application/octet-stream";
  if (!hasAcceptedExtension || !hasAcceptedType) {
    return `${converter.label} conversion accepts ${converter.acceptedExtensions.join(", ")} files.`;
  }

  if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
    const signature = new TextDecoder().decode(arrayBuffer.slice(0, 5));
    return signature === "%PDF-" ? "" : "That file does not look like a valid PDF.";
  }

  const bytes = new Uint8Array(arrayBuffer.slice(0, 16));
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  return isPng || isJpeg || isWebp ? "" : "That image file type is not supported yet.";
}

export function sourceObjectKey(jobId, fileName, converterId = "bank") {
  const converter = supportedConverters()[normalizeConverterId(converterId)];
  const extension = safeFileName(fileName).split(".").pop()?.toLowerCase() || "bin";
  return `sources/${jobId}/${converter.sourcePrefix}.${extension}`;
}

export async function insertJob(env, job) {
  await env.AICONVERTER_DB.prepare(
    `INSERT INTO jobs (
      id, token_hash, status, plan_id, email, source_key, result_key,
      original_file_name, file_size, estimated_pages, file_hash, ip_hash,
      user_agent_hash, converter_id, input_mime_type, created_at, updated_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      job.id,
      job.tokenHash,
      job.status,
      job.planId,
      job.email || "",
      job.sourceKey,
      job.resultKey,
      job.originalFileName,
      job.fileSize,
      job.estimatedPages,
      job.fileHash || "",
      job.ipHash || "",
      job.userAgentHash || "",
      normalizeConverterId(job.converterId),
      job.inputMimeType || "",
      job.now,
      job.now,
      job.expiresAt
    )
    .run();
}

export async function requestFingerprint(env, request) {
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown";
  const ua = request.headers.get("User-Agent") || "unknown";
  const saltStatus = rateLimitSaltStatus(env);
  const salt = saltStatus.ok ? saltStatus.salt : runtimeFallbackSalt();
  return {
    ipHash: await sha256(`${salt}:ip:${ip}`),
    userAgentHash: await sha256(`${salt}:ua:${ua.slice(0, 240)}`),
    saltWarning: saltStatus.warning
  };
}

export function estimatePdfPagesFromBytes(arrayBuffer) {
  try {
    const text = new TextDecoder("latin1").decode(arrayBuffer);
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches?.length || 0;
  } catch {
    return 0;
  }
}

export async function enforceUploadPolicy(env, { ipHash, fileHash }) {
  const now = new Date();
  const nowIso = now.toISOString();
  const dayAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await env.AICONVERTER_DB.prepare("DELETE FROM abuse_events WHERE expires_at < ?").bind(nowIso).run();

  const ipRow = await env.AICONVERTER_DB.prepare(
    "SELECT COUNT(*) AS count FROM abuse_events WHERE ip_hash = ? AND event_type = 'preview' AND created_at > ?"
  )
    .bind(ipHash, dayAgoIso)
    .first();
  if (Number(ipRow?.count || 0) >= 20) {
    return { ok: false, message: "Too many previews from this connection today. Try again later." };
  }

  const fileRow = await env.AICONVERTER_DB.prepare(
    "SELECT COUNT(*) AS count FROM abuse_events WHERE file_hash = ? AND event_type = 'preview' AND created_at > ?"
  )
    .bind(fileHash, dayAgoIso)
    .first();
  if (Number(fileRow?.count || 0) >= 2) {
    return { ok: false, message: "This file has already used its free preview window today." };
  }

  await env.AICONVERTER_DB.prepare(
    `INSERT INTO abuse_events (id, ip_hash, file_hash, event_type, created_at, expires_at)
     VALUES (?, ?, ?, 'preview', ?, ?)`
  )
    .bind(randomId("evt"), ipHash, fileHash, nowIso, expiresAt)
    .run();

  return { ok: true, message: "" };
}

export async function updateJob(env, id, fields) {
  const assignments = [];
  const values = [];

  Object.entries(fields).forEach(([key, value]) => {
    assignments.push(`${key} = ?`);
    values.push(value);
  });

  assignments.push("updated_at = ?");
  values.push(new Date().toISOString(), id);

  await env.AICONVERTER_DB.prepare(`UPDATE jobs SET ${assignments.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function recordJobAttempt(env, { jobId, attemptType, status, error = "", metadata = {} }) {
  if (!env?.AICONVERTER_DB || !jobId || !attemptType || !status) return "";
  const now = new Date().toISOString();
  const id = randomId("attempt");
  await env.AICONVERTER_DB.prepare(
    `INSERT INTO job_attempts (id, job_id, attempt_type, status, error, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      jobId,
      attemptType,
      status,
      String(error || "").slice(0, 1000),
      JSON.stringify(metadata || {}).slice(0, 4000),
      now,
      now
    )
    .run();
  return id;
}

export function sourceExpired(job, now = Date.now()) {
  if (!job || job.source_deleted_at) return false;
  const createdAt = Date.parse(job.created_at || "");
  if (!Number.isFinite(createdAt)) return false;
  return now - createdAt >= SOURCE_RETENTION_SECONDS * 1000;
}

export function resultExpired(job, now = Date.now()) {
  if (!job?.expires_at) return false;
  const expiresAt = Date.parse(job.expires_at);
  return Number.isFinite(expiresAt) && expiresAt <= now;
}

export async function enforceJobExpiry(env, job) {
  if (!job) return null;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const fields = {};

  if (resultExpired(job, now)) {
    const keys = new Set([job.source_key, job.preview_key, job.result_key].filter(Boolean));
    await Promise.all([...keys].map((key) => env.AICONVERTER_BUCKET.delete(key).catch(() => {})));
    fields.source_deleted_at = fields.source_deleted_at || job.source_deleted_at || nowIso;
    fields.status = "expired";
    fields.error = job.error || "This conversion has expired.";
    await updateJob(env, job.id, fields).catch(() => {});
    return null;
  }

  if (sourceExpired(job, now)) {
    if (job.source_key) await env.AICONVERTER_BUCKET.delete(job.source_key).catch(() => {});
    fields.source_deleted_at = nowIso;
  }

  if (Object.keys(fields).length) {
    await updateJob(env, job.id, fields).catch(() => {});
    return { ...job, ...fields };
  }

  return job;
}

export async function getAuthorizedJob(env, id, token) {
  if (!id || !token) return null;
  const tokenHash = await sha256(token);
  const job = await env.AICONVERTER_DB.prepare("SELECT * FROM jobs WHERE id = ? AND token_hash = ?")
    .bind(id, tokenHash)
    .first();
  return enforceJobExpiry(env, job || null);
}

export async function enforceRateLimit(env, request) {
  const saltStatus = rateLimitSaltStatus(env);
  if (!saltStatus.ok) {
    return {
      ok: false,
      limit: 0,
      configurationError: true,
      message: saltStatus.warning
    };
  }

  const max = Math.max(1, Math.min(100, Number(env.RATE_LIMIT_MAX_PER_HOUR || 8)));
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown";
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  const windowId = windowStart.toISOString();
  const id = await sha256(`${saltStatus.salt}:${ip}:${windowId}`);
  const now = new Date().toISOString();
  const expiresAt = new Date(windowStart.getTime() + 2 * 60 * 60 * 1000).toISOString();

  await env.AICONVERTER_DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();
  await env.AICONVERTER_DB.prepare(
    `INSERT INTO rate_limits (id, window_start, count, expires_at, updated_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET count = count + 1, updated_at = ?`
  )
    .bind(id, windowId, expiresAt, now, now)
    .run();

  const row = await env.AICONVERTER_DB.prepare("SELECT count FROM rate_limits WHERE id = ?").bind(id).first();
  return {
    ok: Number(row?.count || 0) <= max,
    limit: max,
    warning: saltStatus.warning
  };
}

function runtimeFallbackSalt() {
  if (!runtimeRateLimitSalt) runtimeRateLimitSalt = crypto.randomUUID();
  console.warn(
    "AIConverter RATE_LIMIT_SALT is missing or weak outside the upload limiter; using runtime-only fingerprint salt."
  );
  return runtimeRateLimitSalt;
}

export function rowsToCsv(rows, columns = DEFAULT_CSV_COLUMNS) {
  const header = columns.map((column) => (typeof column === "string" ? column : column.key)).filter(Boolean);
  const lines = [header.join(",")];

  rows.forEach((row) => {
    lines.push(
      header
        .map((key) => {
          const value = row[key] ?? "";
          const text = String(value).replaceAll('"', '""');
          return /[",\n]/.test(text) ? `"${text}"` : text;
        })
        .join(",")
    );
  });

  return `${lines.join("\n")}\n`;
}

export function parseCsvPreview(csv, limit = 5) {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines.shift()?.split(",") || [];
  return lines.slice(0, limit).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] || "";
      return row;
    }, {});
  });
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}
