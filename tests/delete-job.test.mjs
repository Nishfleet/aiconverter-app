import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/delete-job.js";
import { jobAccessCookie, sha256 } from "../functions/lib/jobs.js";

test("authorized delete removes stored job objects and clears matching cookie", async () => {
  const token = "tok_123";
  const tokenHash = await sha256(token);
  const deletedKeys = [];
  const updates = [];
  const job = {
    id: "job_123",
    token_hash: tokenHash,
    status: "complete",
    source_key: "sources/job_123/source.pdf",
    preview_key: "jobs/job_123/preview.csv",
    result_key: "jobs/job_123/result.csv",
    validation_report_key: "jobs/job_123/validation.txt",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  const env = {
    AICONVERTER_BUCKET: {
      delete: async (key) => {
        deletedKeys.push(key);
      }
    },
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT * FROM jobs")) {
          return {
            bind(id, hash) {
              return {
                first: async () => (id === job.id && hash === tokenHash ? job : null)
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
                }
              };
            }
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };

  const response = await onRequestPost({
    env,
    request: new Request("https://aiconverter.app/api/delete-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: jobAccessCookie(job.id, token).split(";")[0]
      },
      body: JSON.stringify({ jobId: job.id })
    })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(deletedKeys.sort(), [
    "jobs/job_123/preview.csv",
    "jobs/job_123/result.csv",
    "jobs/job_123/validation.txt",
    "sources/job_123/source.pdf"
  ]);
  assert.equal(updates.length, 1);
  assert.match(updates[0].sql, /status = \?/);
  assert.equal(updates[0].values[0], "deleted");
  assert.match(response.headers.get("Set-Cookie") || "", /Max-Age=0/);

  const payload = await response.json();
  assert.equal(payload.status, "deleted");
  assert.equal(payload.sourceDeletedAt.length > 0, true);
});
