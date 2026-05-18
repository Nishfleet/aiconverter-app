import { requireAdmin } from "../../lib/admin-auth.js";
import { createDodoCheckout } from "../../lib/dodo.js";
import { json, methodNotAllowed, serverError } from "../../lib/http.js";
import {
  hasRequiredBindings,
  insertJob,
  jobAccessCookie,
  PLANS,
  randomId,
  randomToken,
  RESULT_RETENTION_SECONDS,
  sha256,
  sha256Bytes,
  updateJob
} from "../../lib/jobs.js";

const DRILL_EMAIL = "admin-drill@aiconverter.app";
const TRUSTED_CHECKOUT_HOSTS = new Set(["checkout.dodopayments.com", "test.checkout.dodopayments.com"]);

export function onRequestGet() {
  return methodNotAllowed("POST");
}

export async function onRequestPost({ request, env }) {
  if (!hasRequiredBindings(env)) {
    return serverError("Secure conversion storage is not configured yet.");
  }

  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const plan = PLANS.starter;
  const jobId = randomId("checkout_drill");
  const token = randomToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + RESULT_RETENTION_SECONDS * 1000).toISOString();
  const sourceText = `AI Converter checkout drill\ncreated_at,${now}\n`;
  const sourceBytes = new TextEncoder().encode(sourceText);
  const sourceBuffer = sourceBytes.buffer.slice(sourceBytes.byteOffset, sourceBytes.byteOffset + sourceBytes.byteLength);
  const sourceKey = `jobs/${jobId}/source.csv`;
  const previewKey = `jobs/${jobId}/preview.csv`;
  const resultKey = `jobs/${jobId}/result.csv`;

  await insertJob(env, {
    id: jobId,
    tokenHash: await sha256(token),
    status: "preview_ready",
    planId: plan.id,
    email: DRILL_EMAIL,
    sourceKey,
    resultKey,
    originalFileName: "checkout-drill.csv",
    fileSize: sourceBytes.byteLength,
    estimatedPages: 1,
    converterId: "bank",
    inputMimeType: "text/csv",
    outputFormat: "csv",
    fileHash: await sha256Bytes(sourceBuffer),
    ipHash: "admin-checkout-drill",
    userAgentHash: "admin-checkout-drill",
    now,
    expiresAt
  });

  await Promise.all([
    env.AICONVERTER_BUCKET.put(sourceKey, sourceBuffer, {
      httpMetadata: { contentType: "text/csv; charset=utf-8" },
      customMetadata: { jobId, purpose: "admin-checkout-drill-source", deleteAfter: expiresAt }
    }),
    env.AICONVERTER_BUCKET.put(previewKey, "Date,Description,Money In,Money Out,Balance\n", {
      httpMetadata: { contentType: "text/csv; charset=utf-8" },
      customMetadata: { jobId, purpose: "admin-checkout-drill-preview", deleteAfter: expiresAt }
    })
  ]);

  await updateJob(env, jobId, {
    preview_key: previewKey,
    confidence: 1,
    row_count: 0,
    extractor: "admin-checkout-drill"
  });

  const job = await readJob(env, jobId);
  let checkoutUrl = "";
  try {
    checkoutUrl = await createDodoCheckout({
      env,
      request,
      job,
      plan,
      email: DRILL_EMAIL
    });
  } catch (error) {
    return json(
      {
        ok: false,
        jobId,
        code: error?.code || "DODO_CHECKOUT_ERROR",
        message: error?.message || "Dodo checkout could not be created."
      },
      { status: 503 }
    );
  }

  if (!checkoutUrl) {
    return json({ ok: false, jobId, message: "Dodo checkout URL was not returned." }, { status: 503 });
  }

  const checkout = new URL(checkoutUrl);
  if (!isTrustedCheckout(checkout)) {
    return json({ ok: false, jobId, message: "Dodo checkout host is not trusted." }, { status: 502 });
  }

  return json(
    {
      ok: true,
      mode: "checkout",
      jobId,
      checkoutHost: checkout.host,
      cookieSet: true,
      plan: {
        id: plan.id,
        detail: plan.detail,
        amount: plan.amount,
        currency: plan.currency
      },
      message: "Admin checkout drill created a live Dodo checkout handoff."
    },
    {
      headers: {
        "Set-Cookie": jobAccessCookie(jobId, token)
      }
    }
  );
}

async function readJob(env, jobId) {
  return env.AICONVERTER_DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(jobId).first();
}

function isTrustedCheckout(url) {
  return (
    url.protocol === "https:" &&
    (TRUSTED_CHECKOUT_HOSTS.has(url.hostname) || url.hostname.endsWith(".dodopayments.com"))
  );
}
