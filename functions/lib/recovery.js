import { billingSummaryForJob } from "./billing-summary.js";
import { customerEmailHash, emailHint, isValidCustomerEmail, normalizeCustomerEmail } from "./customer-identity.js";
import { sendRecoveryEmail } from "./email.js";
import { randomId, randomToken, requestFingerprint, sha256 } from "./jobs.js";
import { supportCasesForCustomer } from "./support-tickets.js";

const RECOVERY_TTL_SECONDS = 30 * 60;

export async function createRecoveryRequest({ env, request, email }) {
  const normalizedEmail = normalizeCustomerEmail(email);
  if (!isValidCustomerEmail(normalizedEmail)) {
    return { ok: false, status: 400, message: "Use a valid email address." };
  }

  const emailHash = await customerEmailHash(env, normalizedEmail);
  const token = randomToken();
  const tokenHash = await sha256(token);
  const id = randomId("recovery");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RECOVERY_TTL_SECONDS * 1000).toISOString();
  const fingerprint = await requestFingerprint(env, request);

  await env.AICONVERTER_DB.prepare(
    `INSERT INTO customer_recovery_tokens (
      id, email_hash, token_hash, expires_at, used_at, created_at, request_ip_hash, user_agent_hash
    ) VALUES (?, ?, ?, ?, '', ?, ?, ?)`
  )
    .bind(id, emailHash, tokenHash, expiresAt, now.toISOString(), fingerprint.ipHash, fingerprint.userAgentHash)
    .run();

  const recoveryUrl = recoveryUrlFor(request, token);
  const emailResult = await sendRecoveryEmail(env, {
    email: normalizedEmail,
    emailHash,
    recoveryUrl,
    tokenId: id
  });

  return {
    ok: true,
    status: 200,
    emailHash,
    emailHint: emailHint(normalizedEmail),
    emailStatus: emailResult.status,
    recoveryToken: env.RECOVERY_RETURN_TOKEN === "true" ? token : "",
    expiresAt
  };
}

export async function recoverJobsForToken(env, token) {
  const rawToken = String(token || "").trim();
  if (!rawToken) return { ok: false, status: 400, message: "Recovery link is invalid or expired." };

  const tokenHash = await sha256(rawToken);
  const now = new Date().toISOString();
  const tokenRow = await env.AICONVERTER_DB.prepare(
    `SELECT *
     FROM customer_recovery_tokens
     WHERE token_hash = ? AND expires_at > ?
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(tokenHash, now)
    .first();

  if (!tokenRow) return { ok: false, status: 400, message: "Recovery link is invalid or expired." };

  await env.AICONVERTER_DB.prepare("UPDATE customer_recovery_tokens SET used_at = ? WHERE id = ?")
    .bind(now, tokenRow.id)
    .run()
    .catch(() => {});

  const jobsResult = await env.AICONVERTER_DB.prepare(
    `SELECT *
     FROM jobs
     WHERE customer_email_hash = ?
     ORDER BY created_at DESC
     LIMIT 50`
  )
    .bind(tokenRow.email_hash)
    .all();

  const jobs = jobsResult.results || [];
  const supportCases = await supportCasesForCustomer(env, {
    emailHash: tokenRow.email_hash,
    jobIds: jobs.map((job) => job.id)
  });
  const casesByJob = groupCasesByJob(supportCases);

  const summaries = [];
  const accessToken = `recovery:${rawToken}`;
  for (const job of jobs) {
    summaries.push({
      ...publicJobSummary(job, { accessToken }),
      billing: await billingSummaryForJob(env, job),
      supportCases: casesByJob.get(job.id) || []
    });
  }

  return {
    ok: true,
    status: 200,
    emailHash: tokenRow.email_hash,
    jobs: summaries,
    supportCases: supportCases.filter((supportCase) => !supportCase.jobId)
  };
}

export function publicJobSummary(job = {}, options = {}) {
  return {
    id: job.id || "",
    token: options.accessToken || "",
    status: job.status || "",
    converterId: job.converter_id || "bank",
    outputFormat: job.output_format || "",
    planId: job.plan_id || "",
    rowCount: Number(job.row_count || 0),
    confidence: Number(job.confidence || 0),
    createdAt: job.created_at || "",
    updatedAt: job.updated_at || "",
    expiresAt: job.expires_at || "",
    paidAt: job.paid_at || "",
    downloadAvailable: job.status === "complete" && Boolean(job.result_key),
    redoAvailable: Boolean(job.paid_at) && job.status === "complete" && Number(job.redo_count || 0) < 1 && !job.source_deleted_at,
    deleteAvailable: ["preview_ready", "complete", "failed"].includes(job.status),
    labels: {
      clientLabel: job.client_label || "",
      periodLabel: job.period_label || "",
      accountLabel: job.account_label || ""
    },
    message: job.error || ""
  };
}

function recoveryUrlFor(request, token) {
  const url = new URL(request.url);
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("recoveryToken", token);
  return url.toString();
}

function groupCasesByJob(cases) {
  const grouped = new Map();
  cases.forEach((supportCase) => {
    if (!supportCase.jobId) return;
    if (!grouped.has(supportCase.jobId)) grouped.set(supportCase.jobId, []);
    grouped.get(supportCase.jobId).push(supportCase);
  });
  return grouped;
}
