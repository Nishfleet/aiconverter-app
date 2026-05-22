import test from "node:test";
import assert from "node:assert/strict";
import { billingSummaryForJob } from "../functions/lib/billing-summary.js";

test("billing summary reflects paid Dodo job and refund state", async () => {
  const job = {
    id: "job_billing",
    status: "complete",
    plan_id: "starter",
    output_format: "csv",
    paid_at: "2026-05-22T00:00:00.000Z",
    payment_id: "pay_live_123",
    checkout_session_id: "cks_123",
    email: "customer@example.com",
    receipt_email: "customer@example.com",
    refund_status: "pending",
    refund_id: "rf_123"
  };
  const env = fakeEnv({
    payments: [
      {
        job_id: job.id,
        amount: 39900,
        currency: "INR",
        status: "succeeded",
        receipt_email: "customer@example.com"
      }
    ]
  });

  const summary = await billingSummaryForJob(env, job);
  assert.equal(summary.paymentStatus, "paid");
  assert.equal(summary.displayAmount, "₹399.00");
  assert.equal(summary.providerPaymentId, "pay_live_123");
  assert.equal(summary.receiptEmail, "c******r@example.com");
  assert.equal(summary.refundStatus, "pending");
  assert.equal(summary.portalStatus, "support");
});

test("billing summary does not invent paid state for checkout handoff", async () => {
  const summary = await billingSummaryForJob(fakeEnv(), {
    id: "job_unpaid",
    status: "preview_ready",
    plan_id: "batch",
    checkout_session_id: "cks_pending"
  });

  assert.equal(summary.paymentStatus, "checkout_started");
  assert.equal(summary.amount, 79900);
  assert.equal(summary.currency, "INR");
  assert.equal(summary.providerPaymentId, "");
});

function fakeEnv(state = {}) {
  return {
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.includes("FROM dodo_payment_events")) {
          return {
            bind(jobId) {
              return { first: async () => (state.payments || []).find((payment) => payment.job_id === jobId) || null };
            }
          };
        }
        if (sql.includes("FROM dodo_refund_events")) {
          return { bind: () => ({ first: async () => null }) };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}
