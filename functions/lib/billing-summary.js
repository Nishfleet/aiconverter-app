import { emailHint } from "./customer-identity.js";
import { getAuthorizedJob, jobOutputFormat, PLANS, tokenFromBodyOrCookie } from "./jobs.js";

export async function billingSummaryForJob(env, job) {
  if (!job?.id) return null;
  const payment = await latestPaymentEvent(env, job.id);
  const refund = await latestRefundEvent(env, job);
  const plan = PLANS[job.plan_id] || PLANS.starter;
  const paid = Boolean(job.paid_at);
  const amount = Number(payment?.amount || plan.amount || 0);
  const currency = String(payment?.currency || plan.currency || "").toUpperCase();
  const receiptEmail = job.receipt_email || job.email || payment?.receipt_email || "";

  return {
    jobId: job.id,
    planId: job.plan_id || plan.id,
    outputFormat: jobOutputFormat(job),
    amount,
    currency,
    displayAmount: formatMoney(amount, currency),
    paymentStatus: paid ? "paid" : payment?.status || (job.checkout_session_id ? "checkout_started" : "unpaid"),
    providerPaymentId: job.payment_id || payment?.payment_id || "",
    checkoutSessionId: job.checkout_session_id || payment?.checkout_session_id || "",
    receiptEmail: receiptEmail ? emailHint(receiptEmail) : "",
    refundStatus: job.refund_status || refund?.status || "",
    refundId: job.refund_id || refund?.refund_id || "",
    receiptUrl: job.dodo_receipt_url || payment?.receipt_url || "",
    invoiceUrl: job.dodo_invoice_url || payment?.invoice_url || "",
    portalStatus: job.dodo_customer_id && env.DODO_CUSTOMER_PORTAL_ENABLED === "true" ? "available" : "support",
    supportPath: `/support/?jobId=${encodeURIComponent(job.id)}&category=payment`
  };
}

export async function authorizedBillingSummary({ env, request, body }) {
  const jobId = String(body?.jobId || "");
  const token = tokenFromBodyOrCookie(request, jobId, String(body?.token || ""));
  const job = await getAuthorizedJob(env, jobId, token);
  if (!job) return null;
  return billingSummaryForJob(env, job);
}

async function latestPaymentEvent(env, jobId) {
  if (!env?.AICONVERTER_DB || !jobId) return null;
  try {
    return await env.AICONVERTER_DB.prepare(
      `SELECT *
       FROM dodo_payment_events
       WHERE job_id = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
      .bind(jobId)
      .first();
  } catch {
    return null;
  }
}

async function latestRefundEvent(env, job) {
  if (!env?.AICONVERTER_DB || !job?.id) return null;
  try {
    return await env.AICONVERTER_DB.prepare(
      `SELECT *
       FROM dodo_refund_events
       WHERE job_id = ? OR (payment_id != '' AND payment_id = ?)
       ORDER BY created_at DESC
       LIMIT 1`
    )
      .bind(job.id, job.payment_id || "")
      .first();
  } catch {
    return null;
  }
}

function formatMoney(minorAmount, currency) {
  const code = String(currency || "").toUpperCase();
  const value = Number(minorAmount || 0) / 100;
  if (!code || !Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}
