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
function makeEnv({ job }) {
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
    env: { AICONVERTER_DB: db, DODO_PAYMENTS_WEBHOOK_KEY: SECRET },
    mutations,
    webhookRows,
    job
  };
}

function paidEventPayload(job) {
  return JSON.stringify({
    type: "payment.succeeded",
    data: {
      id: "pay_webhook_test_1",
      payment_id: "pay_webhook_test_1",
      status: "succeeded",
      amount: 39900,
      currency: "INR",
      metadata: { job_id: job.id, plan_id: job.plan_id }
    }
  });
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
