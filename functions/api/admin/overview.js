import { json, methodNotAllowed, serverError } from "../../lib/http.js";
import { hasCloudConvertConfig } from "../../lib/cloudconvert.js";
import { dodoProductIdForPlan, hasDodoApi, hasDodoWebhookSecret } from "../../lib/dodo.js";
import { hasAzureConfig, hasExtractorBinding, hasMistralConfig, hasRequiredBindings, PLANS } from "../../lib/jobs.js";

export function onRequestPost() {
  return methodNotAllowed("GET");
}

export async function onRequestGet({ request, env }) {
  if (!hasRequiredBindings(env)) {
    return serverError("Secure conversion storage is not configured yet.");
  }

  const auth = authorizeAdmin(request, env);
  if (!auth.ok) return json({ error: auth.message }, { status: auth.status });

  const [jobStatus, watchlist, support, payments, refunds, webhooks] = await Promise.all([
    queryAll(env, "SELECT status, COUNT(*) AS count FROM jobs GROUP BY status ORDER BY count DESC"),
    queryAll(
      env,
      `SELECT id, status, converter_id, plan_id, row_count, confidence, refund_status, error, created_at, updated_at
       FROM jobs
       WHERE status IN ('failed', 'converting_full', 'expired')
          OR COALESCE(refund_status, '') != ''
       ORDER BY updated_at DESC
       LIMIT 25`
    ),
    queryAll(
      env,
      `SELECT id, job_id, email, category, status, substr(message, 1, 240) AS message_excerpt, created_at
       FROM support_requests
       WHERE status != 'closed'
       ORDER BY created_at DESC
       LIMIT 25`
    ),
    queryAll(
      env,
      `SELECT event_type, job_id, payment_id, plan_id, status, amount, currency, match_status, created_at
       FROM dodo_payment_events
       ORDER BY created_at DESC
       LIMIT 25`
    ),
    queryAll(
      env,
      `SELECT job_id, payment_id, refund_id, status, reason, amount, currency, created_at
       FROM dodo_refund_events
       ORDER BY created_at DESC
       LIMIT 25`
    ),
    queryAll(
      env,
      `SELECT webhook_id, event_type, status, received_count, error, updated_at
       FROM dodo_webhook_events
       ORDER BY updated_at DESC
       LIMIT 25`
    )
  ]);

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    health: runtimeHealth(env),
    jobStatus,
    watchlist,
    support,
    payments,
    refunds,
    webhooks
  });
}

function runtimeHealth(env) {
  const dodoProducts = Object.keys(PLANS).reduce((acc, planId) => {
    acc[planId] = Boolean(dodoProductIdForPlan(env, planId));
    return acc;
  }, {});
  const missing = [];
  if (!hasRequiredBindings(env)) missing.push("storage/database bindings");
  if (!hasDodoApi(env)) missing.push("Dodo API key");
  if (!hasDodoWebhookSecret(env)) missing.push("Dodo webhook secret");
  Object.entries(dodoProducts).forEach(([planId, present]) => {
    if (!present) missing.push(`Dodo ${planId} product ID`);
  });
  if (!hasExtractorBinding(env)) missing.push("OCR fallback provider");
  if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY) missing.push("Turnstile keys");
  if (!hasCloudConvertConfig(env)) missing.push("CloudConvert API key");

  return {
    status: missing.length ? "attention" : "ready",
    missing,
    storageConfigured: hasRequiredBindings(env),
    payments: {
      provider: "dodo",
      mode: String(env.DODO_ENVIRONMENT || env.DODO_MODE || "live").toLowerCase().includes("test") ? "test" : "live",
      apiConfigured: hasDodoApi(env),
      webhookConfigured: hasDodoWebhookSecret(env),
      products: dodoProducts,
      freeDownloads: env.FREE_DOWNLOADS_ENABLED === "true",
      autoRefunds: env.AUTO_REFUNDS_ENABLED === "true"
    },
    extraction: {
      nativePdf: true,
      mistral: hasMistralConfig(env),
      azureFallback: hasAzureConfig(env),
      cloudflareFallback: Boolean(env.ALLOW_CLOUDFLARE_FALLBACK === "true" && env.AI),
      workersAi: Boolean(env.AI),
      markdownConversion: Boolean(env.AI?.toMarkdown),
      whisper: Boolean(env.AI?.run),
      screenshotVision: Boolean(env.AI?.run),
      cloudConvert: hasCloudConvertConfig(env)
    },
    protection: {
      turnstile: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY),
      uploadRateLimit: true,
      sameFilePreviewLimit: true,
      paymentReuseGuard: true
    }
  };
}

async function queryAll(env, sql) {
  try {
    const result = await env.AICONVERTER_DB.prepare(sql).all();
    return result.results || [];
  } catch (error) {
    return [{ error: error?.message || "Query failed." }];
  }
}

function authorizeAdmin(request, env) {
  const expected = String(env.ADMIN_TOKEN || "").trim();
  if (expected.length < 24) {
    return { ok: false, status: 503, message: "Admin token is not configured." };
  }

  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  const supplied = String(bearer || request.headers.get("X-Admin-Token") || "").trim();

  return timingSafeEqual(supplied, expected)
    ? { ok: true, status: 200, message: "" }
    : { ok: false, status: 401, message: "Unauthorized." };
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
