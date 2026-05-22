import test from "node:test";
import assert from "node:assert/strict";
import { createRecoveryRequest, recoverJobsForToken } from "../functions/lib/recovery.js";
import { customerEmailHash } from "../functions/lib/customer-identity.js";
import { getAuthorizedJob } from "../functions/lib/jobs.js";

test("email recovery creates a hashed token and returns only matching jobs", async () => {
  const email = "Owner@Example.com";
  const emailHash = await customerEmailHash(testEnv(), email);
  const jobs = [
    {
      id: "job_recovery_match",
      customer_email_hash: emailHash,
      status: "complete",
      converter_id: "bank",
      output_format: "quickbooks-csv",
      plan_id: "starter",
      row_count: 12,
      confidence: 0.91,
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:01:00.000Z",
      expires_at: "2026-05-29T00:00:00.000Z",
      paid_at: "2026-05-22T00:02:00.000Z",
      payment_id: "pay_123",
      receipt_email: email
    },
    {
      id: "job_other",
      customer_email_hash: await customerEmailHash(testEnv(), "other@example.com"),
      status: "complete"
    }
  ];
  const env = testEnv({ jobs });

  const requestResult = await createRecoveryRequest({
    env,
    request: new Request("https://aiconverter.app/api/recovery/request", {
      headers: { "User-Agent": "test", "CF-Connecting-IP": "127.0.0.1" }
    }),
    email
  });

  assert.equal(requestResult.ok, true);
  assert.match(requestResult.recoveryToken, /^[a-f0-9]{48}$/);
  assert.equal(env.tokens.length, 1);
  assert.notEqual(env.tokens[0].token_hash, requestResult.recoveryToken);
  assert.equal(env.emails.length, 1);
  assert.equal(env.emails[0].status, "queued_no_provider");

  const recovered = await recoverJobsForToken(env, requestResult.recoveryToken);
  assert.equal(recovered.ok, true);
  assert.deepEqual(recovered.jobs.map((job) => job.id), ["job_recovery_match"]);
  assert.match(recovered.jobs[0].token, /^recovery:/);
  assert.equal(recovered.jobs[0].billing.paymentStatus, "paid");
  assert.equal(recovered.jobs[0].billing.receiptEmail, "o****r@example.com");
  const authorizedJob = await getAuthorizedJob(env, "job_recovery_match", recovered.jobs[0].token);
  assert.equal(authorizedJob.id, "job_recovery_match");
});

test("expired or invalid recovery tokens fail closed", async () => {
  const env = testEnv({
    tokens: [
      {
        id: "recovery_expired",
        token_hash: await hashToken("expired"),
        email_hash: "email_hash",
        expires_at: "2020-01-01T00:00:00.000Z"
      }
    ]
  });

  const expired = await recoverJobsForToken(env, "expired");
  assert.equal(expired.ok, false);
  assert.equal(expired.status, 400);

  const invalid = await recoverJobsForToken(env, "not-found");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, 400);
});

function testEnv(overrides = {}) {
  const state = {
    tokens: overrides.tokens || [],
    emails: [],
    jobs: overrides.jobs || [],
    payments: overrides.payments || [],
    refunds: overrides.refunds || [],
    support: overrides.support || []
  };
  return {
    RATE_LIMIT_SALT: "x".repeat(32),
    RECOVERY_RETURN_TOKEN: "true",
    AICONVERTER_BUCKET: {},
    tokens: state.tokens,
    emails: state.emails,
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("INSERT INTO customer_recovery_tokens")) {
          return {
            bind(id, emailHash, tokenHash, expiresAt, usedAt, createdAt, ipHash, uaHash) {
              return {
                run: async () => state.tokens.push({ id, email_hash: emailHash, token_hash: tokenHash, expires_at: expiresAt, used_at: usedAt, created_at: createdAt, request_ip_hash: ipHash, user_agent_hash: uaHash })
              };
            }
          };
        }
        if (sql.startsWith("INSERT INTO outbound_email_events")) {
          return {
            bind(id, emailHash, emailHint, template, provider, providerId, status, error, metadata, createdAt, updatedAt) {
              return {
                run: async () => state.emails.push({ id, email_hash: emailHash, email_hint: emailHint, template, provider, provider_id: providerId, status, error, metadata_json: metadata, created_at: createdAt, updated_at: updatedAt })
              };
            }
          };
        }
        if (sql.includes("FROM customer_recovery_tokens")) {
          return {
            bind(tokenHash, now) {
              return {
                first: async () =>
                  state.tokens.find((token) => token.token_hash === tokenHash && token.expires_at > now) || null
              };
            }
          };
        }
        if (sql.startsWith("UPDATE customer_recovery_tokens")) {
          return { bind: () => ({ run: async () => {} }) };
        }
        if (sql.includes("FROM jobs") && sql.includes("id = ?") && sql.includes("customer_email_hash = ?")) {
          return {
            bind(jobId, emailHash) {
              return { first: async () => state.jobs.find((job) => job.id === jobId && job.customer_email_hash === emailHash) || null };
            }
          };
        }
        if (sql.includes("FROM jobs") && sql.includes("customer_email_hash")) {
          return {
            bind(emailHash) {
              return { all: async () => ({ results: state.jobs.filter((job) => job.customer_email_hash === emailHash) }) };
            }
          };
        }
        if (sql.includes("FROM dodo_payment_events")) {
          return {
            bind(jobId) {
              return { first: async () => state.payments.find((payment) => payment.job_id === jobId) || null };
            }
          };
        }
        if (sql.includes("FROM dodo_refund_events")) {
          return {
            bind(jobId, paymentId) {
              return {
                first: async () =>
                  state.refunds.find((refund) => refund.job_id === jobId || (paymentId && refund.payment_id === paymentId)) || null
              };
            }
          };
        }
        if (sql.includes("FROM support_requests")) {
          return { bind: () => ({ all: async () => ({ results: [] }) }) };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}

async function hashToken(value) {
  const { sha256 } = await import("../functions/lib/jobs.js");
  return sha256(value);
}
