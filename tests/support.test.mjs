import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as supportPost } from "../functions/api/support.js";

const SALT = "a-long-private-test-salt-value";

test("support POST rejects a failed Turnstile check with 403 and writes nothing", async () => {
  const writes = [];
  const response = await supportPost({
    env: fakeEnv(writes, { TURNSTILE_SITE_KEY: "site", TURNSTILE_SECRET_KEY: "secret" }),
    request: supportRequest({
      email: "user@example.com",
      jobId: "job_123",
      category: "payment",
      message: "My paid conversion failed, please help me refund it."
    })
  });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.match(body.error, /human check/i);
  assert.equal(writes.length, 0, "no DB statement should run when Turnstile fails");
  assert.equal(writes.some((item) => item.sql.includes("INSERT INTO support_requests")), false);
});

test("support POST honeypot accepts bots without writing a support request", async () => {
  const writes = [];
  const response = await supportPost({
    env: fakeEnv(writes),
    request: supportRequest({
      website: "http://spam.example",
      email: "user@example.com",
      category: "payment",
      message: "My paid conversion failed, please help me refund it."
    })
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(writes.length, 0, "honeypot submissions must never reach the database");
});

test("support POST inserts a scrubbed request and returns its id", async () => {
  const writes = [];
  const response = await supportPost({
    env: fakeEnv(writes),
    request: supportRequest({
      email: "user@example.com" + "y".repeat(150),
      jobId: "job_123<>;DROP TABLE support_requests;--",
      category: "urgent!!",
      message: "issue ".repeat(2000)
    })
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.match(String(body.id), /^sup_[0-9a-f]+$/);

  const insert = writes.find((item) => item.sql.includes("INSERT INTO support_requests"));
  assert.ok(insert, "a support_requests insert should be recorded");
  assert.match(insert.sql, /VALUES \(\?, \?, \?, \?, \?, \?, \?, 'open', \?\)/);
  assert.equal(insert.values[0], body.id);

  // job_id: only [a-zA-Z0-9_-] survive the scrub (<>, ;, and spaces are stripped;
  // hyphens are allowed, so the trailing -- stays).
  assert.equal(insert.values[1], "job_123DROPTABLEsupport_requests--");

  // email is capped at 160 chars; the y-tail past the slice is cut away.
  assert.equal(insert.values[2].length, 160);
  assert.equal(insert.values[2], "user@example.com" + "y".repeat(144));

  // unknown categories fall back to "other".
  assert.equal(insert.values[3], "other");

  // message is capped at 4000 chars.
  assert.equal(insert.values[4].length, 4000);
  assert.ok(insert.values[4].startsWith("issue "));

  // hashed fingerprints, never raw IP or user agent.
  assert.match(insert.values[5], /^[0-9a-f]{64}$/);
  assert.match(insert.values[6], /^[0-9a-f]{64}$/);
});

test("support POST rate-limits at 5 requests per hour (sixth returns 429, no insert)", async () => {
  const writes = [];
  const env = fakeEnv(writes);

  for (let index = 0; index < 5; index += 1) {
    const response = await supportPost({
      env,
      request: supportRequest({
        email: "user@example.com",
        jobId: `job_${index}`,
        category: "payment",
        message: `My paid conversion failed, please help refund issue ${index}.`
      })
    });
    assert.equal(response.status, 200, `request ${index + 1} should be accepted`);
    assert.equal((await response.json()).ok, true);
  }

  const sixth = await supportPost({
    env,
    request: supportRequest({
      email: "user@example.com",
      jobId: "job_6",
      category: "payment",
      message: "My sixth conversion failed, please help me refund it."
    })
  });

  assert.equal(sixth.status, 429);
  assert.match((await sixth.json()).error, /Too many support requests/);
  const inserts = writes.filter((item) => item.sql.includes("INSERT INTO support_requests"));
  assert.equal(inserts.length, 5, "the sixth request must not be written");
});

function supportRequest(body) {
  return new Request("https://aiconverter.app/api/support", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "CF-Connecting-IP": "203.0.113.50",
      "User-Agent": "Support route test"
    },
    body: JSON.stringify(body)
  });
}

function fakeEnv(writes, extra = {}) {
  const rows = [];
  return {
    AICONVERTER_BUCKET: {},
    RATE_LIMIT_SALT: SALT,
    AICONVERTER_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                writes.push({ sql, values });
                if (sql.includes("INSERT INTO support_requests")) {
                  rows.push({ ip_hash: values[5], created_at: values[7] });
                }
                return { success: true };
              },
              async first() {
                if (sql.includes("SELECT COUNT(*)")) {
                  const [ipHash] = values;
                  return { count: rows.filter((row) => row.ip_hash === ipHash).length };
                }
                return null;
              }
            };
          }
        };
      }
    },
    ...extra
  };
}
