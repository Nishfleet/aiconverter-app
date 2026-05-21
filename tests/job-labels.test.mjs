import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as updateLabels } from "../functions/api/job-labels.js";
import { sha256 } from "../functions/lib/jobs.js";

test("job labels persist against an authorized conversion token", async () => {
  const token = "tok_labels";
  const tokenHash = await sha256(token);
  const job = { id: "job_labels", token_hash: tokenHash, status: "preview_ready" };
  const updates = [];

  const response = await updateLabels({
    env: fakeEnv(job, updates),
    request: new Request("https://aiconverter.app/api/job-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        token,
        clientLabel: "Acme / India",
        periodLabel: "2026-05",
        accountLabel: "Checking\n1234"
      })
    })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.labels, {
    clientLabel: "Acme / India",
    periodLabel: "2026-05",
    accountLabel: "Checking 1234"
  });
  assert.equal(updates[0].client_label, "Acme / India");
  assert.equal(updates[0].period_label, "2026-05");
  assert.equal(updates[0].account_label, "Checking 1234");
});

function fakeEnv(job, updates) {
  return {
    AICONVERTER_BUCKET: {},
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT * FROM jobs WHERE id = ? AND token_hash = ?")) {
          return {
            bind(id, hash) {
              return { first: async () => (id === job.id && hash === job.token_hash ? job : null) };
            }
          };
        }
        if (sql.startsWith("UPDATE jobs SET")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  const fields = {};
                  const assignments = sql.match(/SET (.*) WHERE/)?.[1]?.split(", ") || [];
                  assignments.forEach((assignment, index) => {
                    const key = assignment.split(" = ")[0];
                    if (key !== "updated_at") fields[key] = values[index];
                  });
                  updates.push(fields);
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
