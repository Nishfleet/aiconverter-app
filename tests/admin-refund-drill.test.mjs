import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as refundDrill } from "../functions/api/admin/refund-drill.js";

test("admin refund drill refunds only a confirmed paid checkout drill job", async () => {
  const originalFetch = globalThis.fetch;
  const job = {
    id: "checkout_drill_refund123",
    email: "admin-drill@aiconverter.app",
    original_file_name: "checkout-drill-statement.pdf",
    paid_at: "2026-05-18T00:00:00.000Z",
    payment_id: "pay_drill_123",
    plan_id: "starter",
    download_count: 1
  };
  const events = [];
  const attempts = [];
  const updates = [];
  globalThis.fetch = async (url, options = {}) => {
    assert.equal(String(url), "https://live.dodopayments.com/refunds");
    const body = JSON.parse(options.body);
    assert.equal(body.payment_id, job.payment_id);
    assert.equal(body.metadata.job_id, job.id);
    return Response.json({
      refund_id: "ref_drill_123",
      payment_id: job.payment_id,
      status: "succeeded",
      amount: 39900,
      currency: "INR"
    });
  };

  try {
    const response = await refundDrill({
      env: fakeEnv({ job, events, attempts, updates }),
      request: new Request("https://aiconverter.app/api/admin/refund-drill", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${"a".repeat(32)}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobId: job.id, confirmJobId: job.id })
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.refundStatus, "succeeded");
    assert.equal(payload.refundId, "ref_drill_123");
    assert.equal(job.refund_status, "succeeded");
    assert.equal(job.refund_id, "ref_drill_123");
    assert.equal(events.length, 2);
    assert.equal(attempts.length, 2);
    assert.ok(updates.length >= 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin refund drill refuses non-drill jobs", async () => {
  const job = {
    id: "job_customer",
    email: "customer@example.com",
    original_file_name: "statement.pdf",
    paid_at: "2026-05-18T00:00:00.000Z",
    payment_id: "pay_customer"
  };
  const response = await refundDrill({
    env: fakeEnv({ job }),
    request: new Request("https://aiconverter.app/api/admin/refund-drill", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${"a".repeat(32)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jobId: job.id, confirmJobId: job.id })
    })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /only refunds admin checkout drill jobs/i);
});

test("admin refund drill retries a refund-due drill job after operator confirmation", async () => {
  const originalFetch = globalThis.fetch;
  const job = {
    id: "checkout_drill_retry123",
    email: "admin-drill@aiconverter.app",
    original_file_name: "checkout-drill-statement.pdf",
    paid_at: "2026-05-18T00:00:00.000Z",
    payment_id: "pay_drill_retry",
    plan_id: "starter",
    download_count: 1,
    refund_status: "refund_due",
    refund_id: ""
  };
  let refundCalls = 0;
  globalThis.fetch = async () => {
    refundCalls += 1;
    return Response.json({
      refund_id: "ref_retry_123",
      payment_id: job.payment_id,
      status: "succeeded",
      amount: 39900,
      currency: "INR"
    });
  };

  try {
    const response = await refundDrill({
      env: fakeEnv({ job }),
      request: new Request("https://aiconverter.app/api/admin/refund-drill", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${"a".repeat(32)}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobId: job.id, confirmJobId: job.id })
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.refundStatus, "succeeded");
    assert.equal(payload.refundId, "ref_retry_123");
    assert.equal(refundCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin refund drill rejects a missing token with 401 and zero Dodo refund calls", async () => {
  const originalFetch = globalThis.fetch;
  const job = {
    id: "checkout_drill_auth123",
    email: "admin-drill@aiconverter.app",
    original_file_name: "checkout-drill-statement.pdf",
    paid_at: "2026-05-18T00:00:00.000Z",
    payment_id: "pay_drill_auth",
    plan_id: "starter",
    download_count: 1
  };
  const events = [];
  const attempts = [];
  const updates = [];
  let refundCalls = 0;
  globalThis.fetch = async () => {
    refundCalls += 1;
    assert.fail("no Dodo refund call may happen for an unauthenticated request");
  };

  try {
    const response = await refundDrill({
      env: fakeEnv({ job, events, attempts, updates }),
      request: new Request("https://aiconverter.app/api/admin/refund-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, confirmJobId: job.id })
      })
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized." });
    assert.equal(refundCalls, 0, "Dodo must not be called without a token");
    assert.equal(events.length, 0, "no refund event may be recorded without a token");
    assert.equal(attempts.length, 0, "no attempt may be recorded without a token");
    assert.equal(updates.length, 0, "no job update may happen without a token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin refund drill rejects a wrong token with 401 and zero Dodo refund calls", async () => {
  const originalFetch = globalThis.fetch;
  const job = {
    id: "checkout_drill_auth456",
    email: "admin-drill@aiconverter.app",
    original_file_name: "checkout-drill-statement.pdf",
    paid_at: "2026-05-18T00:00:00.000Z",
    payment_id: "pay_drill_auth456",
    plan_id: "starter",
    download_count: 1
  };
  const events = [];
  const attempts = [];
  const updates = [];
  let refundCalls = 0;
  globalThis.fetch = async () => {
    refundCalls += 1;
    assert.fail("no Dodo refund call may happen for an unauthenticated request");
  };

  try {
    const response = await refundDrill({
      env: fakeEnv({ job, events, attempts, updates }),
      request: new Request("https://aiconverter.app/api/admin/refund-drill", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${"b".repeat(32)}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobId: job.id, confirmJobId: job.id })
      })
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized." });
    assert.equal(refundCalls, 0, "Dodo must not be called with a wrong token");
    assert.equal(events.length, 0, "no refund event may be recorded with a wrong token");
    assert.equal(attempts.length, 0, "no attempt may be recorded with a wrong token");
    assert.equal(updates.length, 0, "no job update may happen with a wrong token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function fakeEnv({ job, events = [], attempts = [], updates = [] }) {
  return {
    ADMIN_TOKEN: "a".repeat(32),
    DODO_PAYMENTS_API_KEY: "dodo_test",
    DODO_CURRENCY: "INR",
    AICONVERTER_BUCKET: {},
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT * FROM jobs WHERE id = ?")) {
          return {
            bind(id) {
              return { first: async () => (id === job.id ? job : null) };
            }
          };
        }
        if (sql.startsWith("INSERT INTO dodo_refund_events")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  events.push({ sql, values });
                }
              };
            }
          };
        }
        if (sql.startsWith("UPDATE dodo_refund_events")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  events.push({ sql, values, update: true });
                }
              };
            }
          };
        }
        if (sql.startsWith("INSERT INTO job_attempts")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  attempts.push({ sql, values });
                }
              };
            }
          };
        }
        if (sql.startsWith("UPDATE jobs SET")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  updates.push({ sql, values });
                  const assignments = sql.match(/SET (.*) WHERE/)?.[1]?.split(", ") || [];
                  assignments.forEach((assignment, index) => {
                    const key = assignment.split(" = ")[0];
                    if (key !== "updated_at") job[key] = values[index];
                  });
                }
              };
            }
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}
