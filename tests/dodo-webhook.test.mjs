import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/webhooks/dodo.js";

const SECRET = `whsec_${btoa("webhook-test-secret")}`;

// Re-implements the Dodo webhook signature scheme exactly as the production
// code does (functions/lib/dodo.js verifyDodoWebhookSignature):
// HMAC-SHA256 over `${webhookId}.${webhookTimestamp}.${payload}` with the
// base64-decoded secret, delivered as a "v1,<base64>" signature part.
async function signWebhook({ payload, webhookId, webhookTimestamp, secret = SECRET }) {
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(String(secret).replace(/^whsec_/, "")), (char) => char.charCodeAt(0)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${webhookId}.${webhookTimestamp}.${payload}`)
  );
  let binary = "";
  new Uint8Array(digest).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `v1,${btoa(binary)}`;
}

function webhookRequest({ payload, webhookId, webhookTimestamp, signature }) {
  return new Request("https://aiconverter.app/api/webhooks/dodo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "webhook-id": webhookId,
      "webhook-timestamp": String(webhookTimestamp),
      "webhook-signature": signature
    },
    body: payload
  });
}

function makeJob(overrides = {}) {
  return {
    id: "job_webhook_1",
    plan_id: "starter",
    status: "pending",
    payment_id: "",
    checkout_session_id: "",
    paid_at: "",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  };
}

// In-memory D1 stub in the same style as the other node:test suites: it
// implements exactly the statements the dodo webhook route issues and records
// every mutation so tests can assert on state change.
// Options extend the single-job default with multi-job lookups:
//   jobsById            map of job id -> job for "SELECT * FROM jobs WHERE id = ?"
//   jobsByPayment       map of payment_id -> job for "SELECT * FROM jobs WHERE payment_id = ?"
//   reusedPaymentJobId  id returned by the payment-id reuse guard query
//   env                 extra AICONVERTER_DB-adjacent bindings (DODO_BUSINESS_ID, ...)
function makeEnv({ job, jobsById, jobsByPayment, reusedPaymentJobId, env: extraEnv = {} } = {}) {
  const webhookRows = new Map();
  const mutations = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          if (sql.startsWith("SELECT status FROM dodo_webhook_events")) {
            const row = webhookRows.get(values[0]);
            return { first: async () => (row ? { status: row.status } : null) };
          }
          if (sql.includes("UPDATE dodo_webhook_events") && sql.includes("received_count")) {
            return {
              run: async () => {
                const row = webhookRows.get(values[2]);
                if (row) {
                  row.received_count += 1;
                  row.last_received_at = values[0];
                  row.updated_at = values[1];
                }
                mutations.push({ sql, values });
              }
            };
          }
          if (sql.startsWith("INSERT INTO dodo_webhook_events")) {
            return {
              run: async () => {
                webhookRows.set(values[0], {
                  webhook_id: values[0],
                  event_type: values[1],
                  payload_hash: values[2],
                  status: "received",
                  received_count: 1
                });
                mutations.push({ sql, values });
              }
            };
          }
          if (sql.includes("UPDATE dodo_webhook_events") && sql.includes("SET status")) {
            return {
              run: async () => {
                const row = webhookRows.get(values[4]);
                if (row) {
                  row.status = values[0];
                  row.error = values[1];
                  row.processed_at = values[2];
                  row.updated_at = values[3];
                }
                mutations.push({ sql, values });
              }
            };
          }
          if (sql.startsWith("SELECT * FROM jobs WHERE payment_id = ? AND id != ?")) {
            // payment-id reuse guard: any OTHER job already holding this payment id.
            return { first: async () => (reusedPaymentJobId ? { id: reusedPaymentJobId } : null) };
          }
          if (sql.startsWith("SELECT * FROM jobs WHERE id = ?")) {
            const row = jobsById ? jobsById[values[0]] : job?.id === values[0] ? job : null;
            return { first: async () => row || null };
          }
          if (sql.startsWith("SELECT * FROM jobs WHERE payment_id = ?")) {
            const row = jobsByPayment ? jobsByPayment[values[0]] : job?.payment_id === values[0] ? job : null;
            return { first: async () => row || null };
          }
          if (sql.startsWith("SELECT id FROM jobs WHERE payment_id")) {
            return { first: async () => null };
          }
          if (sql.startsWith("SELECT * FROM jobs")) {
            return { first: async () => job };
          }
          if (sql.startsWith("UPDATE jobs SET")) {
            return {
              run: async () => {
                mutations.push({ sql, values });
              }
            };
          }
          if (sql.startsWith("INSERT INTO dodo_payment_events")) {
            return {
              run: async () => {
                mutations.push({ sql, values });
              }
            };
          }
          throw new Error(`Unexpected SQL: ${sql}`);
        }
      };
    }
  };
  return {
    env: { AICONVERTER_DB: db, DODO_PAYMENTS_WEBHOOK_KEY: SECRET, ...extraEnv },
    mutations,
    webhookRows,
    job
  };
}

function paidEventPayload(job, dataOverrides = {}) {
  const { metadata = {}, ...rest } = dataOverrides;
  return JSON.stringify({
    type: "payment.succeeded",
    data: {
      id: "pay_webhook_test_1",
      payment_id: "pay_webhook_test_1",
      status: "succeeded",
      amount: 39900,
      currency: "INR",
      metadata: { job_id: job.id, plan_id: job.plan_id, ...metadata },
      ...rest
    }
  });
}

// Signs and delivers a webhook through the real route, returning the response.
async function postSigned({ env, payload, webhookId }) {
  const webhookTimestamp = Math.floor(Date.now() / 1000);
  const signature = await signWebhook({ payload, webhookId, webhookTimestamp });
  const response = await onRequestPost({
    env,
    request: webhookRequest({ payload, webhookId, webhookTimestamp, signature })
  });
  return { response, body: await response.json() };
}

// Every mutation that would credit the customer's job: "UPDATE jobs SET ...".
function jobCreditMutations(mutations) {
  return mutations.filter((mutation) => mutation.sql.startsWith("UPDATE jobs SET"));
}

// The dodo_payment_events INSERT binds match_status at index 13 and matched_by
// at index 12 (see recordDodoPaymentEvent in functions/lib/dodo.js).
function assertRejectedAs({ mutations, reason, matchedBy }) {
  assert.equal(
    jobCreditMutations(mutations).length,
    0,
    `a ${reason} rejection must never touch the job`
  );
  const paymentEvents = mutations.filter((mutation) => mutation.sql.startsWith("INSERT INTO dodo_payment_events"));
  assert.equal(paymentEvents.length, 1, "the rejection is recorded as exactly one payment event");
  assert.equal(paymentEvents[0].values[13], reason, "payment event carries the precise rejection reason");
  assert.equal(paymentEvents[0].values[12], matchedBy, "payment event records which guard rejected the payment");
  assert.notEqual(paymentEvents[0].values[13], "matched", "a rejected payment must never be recorded as matched");
}

test("valid Dodo webhook signature is accepted and credits exactly one job", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({ job });
  const payload = paidEventPayload(job);
  const webhookId = "msg_webhook_1";
  const webhookTimestamp = Math.floor(Date.now() / 1000);
  const signature = await signWebhook({ payload, webhookId, webhookTimestamp });

  const response = await onRequestPost({
    env,
    request: webhookRequest({ payload, webhookId, webhookTimestamp, signature })
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.received, true);
  assert.equal(body.ok, true);
  assert.equal(body.jobId, job.id);

  const jobUpdates = mutations.filter((mutation) => mutation.sql.startsWith("UPDATE jobs SET"));
  assert.equal(jobUpdates.length, 1, "the paying job must be updated exactly once");
  assert.ok(jobUpdates[0].values.includes("pay_webhook_test_1"), "payment_id written to the job");

  const webhookRow = webhookRows.get(webhookId);
  assert.ok(webhookRow, "webhook event row reserved");
  assert.equal(webhookRow.status, "processed", "event marked processed after success");
});

test("invalid Dodo webhook signature is rejected with no state change", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({ job });
  const payload = paidEventPayload(job);
  const webhookId = "msg_webhook_bad";
  const webhookTimestamp = Math.floor(Date.now() / 1000);
  const signature = await signWebhook({
    payload,
    webhookId,
    webhookTimestamp,
    secret: `whsec_${btoa("a-different-secret")}`
  });

  const response = await onRequestPost({
    env,
    request: webhookRequest({ payload, webhookId, webhookTimestamp, signature })
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid signature." });
  assert.equal(mutations.length, 0, "rejected signature must cause zero DB writes");
  assert.equal(webhookRows.size, 0, "no event reservation for a rejected signature");
});

test("stale webhook timestamp is rejected with no state change", async () => {
  const job = makeJob();
  const { env, mutations } = makeEnv({ job });
  const payload = paidEventPayload(job);
  const webhookId = "msg_webhook_stale";
  const webhookTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour old
  const signature = await signWebhook({ payload, webhookId, webhookTimestamp });

  const response = await onRequestPost({
    env,
    request: webhookRequest({ payload, webhookId, webhookTimestamp, signature })
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid signature." });
  assert.equal(mutations.length, 0);
});

test("replayed webhook id is not processed twice and never credits the customer again", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({ job });
  const payload = paidEventPayload(job);
  const webhookId = "msg_webhook_replay";
  const webhookTimestamp = Math.floor(Date.now() / 1000);
  const signature = await signWebhook({ payload, webhookId, webhookTimestamp });

  const first = await onRequestPost({
    env,
    request: webhookRequest({ payload, webhookId, webhookTimestamp, signature })
  });
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.ok, true);

  // Dodo replays the exact same event id after a transient delivery failure.
  const replay = await onRequestPost({
    env,
    request: webhookRequest({ payload, webhookId, webhookTimestamp, signature })
  });

  assert.equal(replay.status, 200);
  const replayBody = await replay.json();
  assert.equal(replayBody.received, true);
  assert.equal(replayBody.duplicate, true, "replayed id must be reported as duplicate");

  const jobUpdates = mutations.filter((mutation) => mutation.sql.startsWith("UPDATE jobs SET"));
  assert.equal(jobUpdates.length, 1, "the job must still have been credited only once");

  const webhookRow = webhookRows.get(webhookId);
  assert.equal(webhookRow.status, "processed");
  assert.equal(webhookRow.received_count, 1, "replay must not bump the received count");
});

test("payment from a foreign Dodo business is rejected and never credits the job", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({ job, env: { DODO_BUSINESS_ID: "biz_aiconverter" } });
  const payload = paidEventPayload(job, { business_id: "biz_foreign" });
  const webhookId = "msg_webhook_business_mismatch";

  const { response, body } = await postSigned({ env, payload, webhookId });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { received: true, ok: false, ignored: true, reason: "business_mismatch" });
  assertRejectedAs({ mutations, reason: "business_mismatch", matchedBy: "business_id" });
  assert.equal(webhookRows.get(webhookId)?.status, "processed", "rejection is still a cleanly processed event");
});

test("payment carrying a foreign plan id is rejected and never credits the job", async () => {
  const job = makeJob(); // plan_id: starter
  const { env, mutations, webhookRows } = makeEnv({ job });
  const payload = paidEventPayload(job, { metadata: { plan_id: "pro" } });
  const webhookId = "msg_webhook_plan_mismatch";

  const { response, body } = await postSigned({ env, payload, webhookId });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { received: true, ok: false, ignored: true, reason: "metadata_plan_mismatch" });
  assertRejectedAs({ mutations, reason: "metadata_plan_mismatch", matchedBy: "metadata_plan_id" });
  assert.equal(webhookRows.get(webhookId)?.status, "processed");
});

test("payment for a product the plan does not own is rejected and never credits the job", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({
    job,
    env: { DODO_PRODUCT_STARTER_ID: "prod_starter_aiconverter" }
  });
  const payload = paidEventPayload(job, { product_cart: [{ product_id: "prod_attacker" }] });
  const webhookId = "msg_webhook_product_mismatch";

  const { response, body } = await postSigned({ env, payload, webhookId });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { received: true, ok: false, ignored: true, reason: "product_mismatch" });
  assertRejectedAs({ mutations, reason: "product_mismatch", matchedBy: "product_id" });
  assert.equal(webhookRows.get(webhookId)?.status, "processed");
});

test("payment in a currency that is not the checkout currency is rejected and never credits the job", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({
    job,
    env: { DODO_CURRENCY: "INR", DODO_ADAPTIVE_CURRENCY: "false" }
  });
  const payload = paidEventPayload(job, { currency: "USD" });
  const webhookId = "msg_webhook_currency_mismatch";

  const { response, body } = await postSigned({ env, payload, webhookId });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { received: true, ok: false, ignored: true, reason: "currency_mismatch" });
  assertRejectedAs({ mutations, reason: "currency_mismatch", matchedBy: "currency" });
  assert.equal(webhookRows.get(webhookId)?.status, "processed");
});

test("underpayment is rejected and never credits the job", async () => {
  const job = makeJob();
  const { env, mutations, webhookRows } = makeEnv({ job, env: { DODO_CURRENCY: "INR" } });
  const payload = paidEventPayload(job, { amount: 39800 }); // starter costs 39900
  const webhookId = "msg_webhook_amount_too_low";

  const { response, body } = await postSigned({ env, payload, webhookId });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { received: true, ok: false, ignored: true, reason: "amount_too_low" });
  assertRejectedAs({ mutations, reason: "amount_too_low", matchedBy: "amount" });
  assert.equal(webhookRows.get(webhookId)?.status, "processed");
});

test("payment id already credited to another job is rejected and never credits a second job", async () => {
  const targetJob = makeJob({ id: "job_webhook_a", checkout_session_id: "cks_webhook_a" });
  const otherJob = makeJob({
    id: "job_webhook_b",
    payment_id: "pay_webhook_reused",
    checkout_session_id: "cks_webhook_b"
  });
  const { env, mutations, webhookRows } = makeEnv({
    job: targetJob,
    jobsById: { job_webhook_a: targetJob, job_webhook_b: otherJob },
    reusedPaymentJobId: "job_webhook_b",
    env: { DODO_CURRENCY: "INR" }
  });
  // A validly signed Dodo event for a payment that was already credited to
  // job_webhook_b, now claiming job_webhook_a via its own checkout metadata.
  const payload = paidEventPayload(targetJob, {
    id: "pay_webhook_reused",
    payment_id: "pay_webhook_reused",
    checkout_session_id: "cks_webhook_a"
  });
  const webhookId = "msg_webhook_payment_reused";

  const { response, body } = await postSigned({ env, payload, webhookId });

  assert.equal(response.status, 200);
  assert.deepEqual(body, { received: true, ok: false, ignored: true, reason: "payment_id_reused" });
  assertRejectedAs({ mutations, reason: "payment_id_reused", matchedBy: "" });
  const paymentEvents = mutations.filter((mutation) => mutation.sql.startsWith("INSERT INTO dodo_payment_events"));
  assert.equal(paymentEvents[0].values[3], targetJob.id, "audit names the target job, not the job that already owns the payment");
  assert.equal(webhookRows.get(webhookId)?.status, "processed");
});
