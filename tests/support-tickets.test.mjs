import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as submitSupport } from "../functions/api/support.js";

test("support API creates ticket id, status, and sanitized case", async () => {
  const inserted = [];
  const statusEvents = [];
  const response = await submitSupport({
    env: fakeEnv(inserted, statusEvents),
    request: new Request("https://aiconverter.app/api/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "test",
        "CF-Connecting-IP": "127.0.0.1"
      },
      body: JSON.stringify({
        email: "customer@example.com",
        jobId: "job_support",
        category: "refund",
        message: "  Refund request for job_support with <script>alert(1)</script>  "
      })
    })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.match(payload.ticketId, /^AIC-\d{8}-[A-Z0-9]{6}$/);
  assert.equal(payload.status, "open");
  assert.equal(inserted[0].topic, "refund");
  assert.equal(inserted[0].message, "Refund request for job_support with <script>alert(1)</script>");
  assert.equal(statusEvents[0].new_status, "open");
});

function fakeEnv(inserted, statusEvents) {
  return {
    RATE_LIMIT_SALT: "x".repeat(32),
    AICONVERTER_BUCKET: {},
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.includes("COUNT(*) AS count FROM support_requests")) {
          return { bind: () => ({ first: async () => ({ count: 0 }) }) };
        }
        if (sql.startsWith("INSERT INTO support_requests")) {
          return {
            bind(id, jobId, email, category, message, ipHash, uaHash, status, createdAt, ticketId, customerEmailHash, topic, statusNote, updatedAt) {
              return {
                run: async () => inserted.push({ id, job_id: jobId, email, category, message, ip_hash: ipHash, user_agent_hash: uaHash, status, created_at: createdAt, ticket_id: ticketId, customer_email_hash: customerEmailHash, topic, public_status_note: statusNote, updated_at: updatedAt })
              };
            }
          };
        }
        if (sql.startsWith("INSERT INTO support_status_events")) {
          return {
            bind(id, supportRequestId, newStatus, note, createdAt) {
              return {
                run: async () => statusEvents.push({ id, support_request_id: supportRequestId, new_status: newStatus, note, created_at: createdAt })
              };
            }
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}
