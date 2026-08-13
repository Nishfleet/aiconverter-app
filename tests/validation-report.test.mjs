import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as validationReportPost, onRequestGet as validationReportGet } from "../functions/api/validation-report.js";
import { sha256 } from "../functions/lib/jobs.js";

const futureExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const REPORT_TEXT = "AI Converter validation report\nAll rows reviewed.\n";

function completeJob(id, tokenHash, overrides = {}) {
  return {
    id,
    token_hash: tokenHash,
    status: "complete",
    validation_report_key: `jobs/${id}/validation-report.txt`,
    original_file_name: "May Statement.pdf",
    created_at: new Date().toISOString(),
    expires_at: futureExpiry(),
    ...overrides
  };
}

// Faithful SQLite emulation: the fake derives its behavior from the SQL it
// receives. Today getAuthorizedJob filters by `id = ? AND token_hash = ?`, so
// a wrong/missing token yields no row. If a mutation drops the token_hash
// predicate (job-id-only lookup), this fake returns the row regardless of
// token, exactly like the real database would — which is what makes the
// focused suite go red under that mutation.
function fakeEnv(jobs, objects = new Map()) {
  return {
    AICONVERTER_BUCKET: {
      get: async (key) => {
        if (!objects.has(key)) return null;
        const content = objects.get(key);
        return {
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(content));
              controller.close();
            }
          }),
          text: async () => content
        };
      },
      delete: async () => {}
    },
    AICONVERTER_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              first: async () => {
                const job = jobs.get(values[0]) || null;
                if (!job) return null;
                const filtersByToken = /token_hash\s*=/.test(sql);
                return filtersByToken && values[1] !== job.token_hash ? null : job;
              }
            };
          }
        };
      }
    }
  };
}

function post(env, body) {
  return validationReportPost({
    env,
    request: new Request("https://aiconverter.app/api/validation-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  });
}

test("GET on the validation-report route is rejected with 405", async () => {
  const response = await validationReportGet();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("missing storage bindings are rejected with 500", async () => {
  const response = await post({}, { jobId: "job_missing_bindings", token: "tok_any" });
  assert.equal(response.status, 500);
});

test("missing token is rejected even with a valid job id", async () => {
  const token = "tok_valid";
  const tokenHash = await sha256(token);
  const jobs = new Map([[ "job_missing_token", completeJob("job_missing_token", tokenHash) ]]);
  const objects = new Map([[ "jobs/job_missing_token/validation-report.txt", REPORT_TEXT ]]);

  const response = await post(fakeEnv(jobs, objects), { jobId: "job_missing_token" });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "Unknown or expired conversion.");
});

test("wrong token is rejected for an existing complete job", async () => {
  const token = "tok_valid";
  const tokenHash = await sha256(token);
  const jobs = new Map([[ "job_wrong_token", completeJob("job_wrong_token", tokenHash) ]]);
  const objects = new Map([[ "jobs/job_wrong_token/validation-report.txt", REPORT_TEXT ]]);

  const response = await post(fakeEnv(jobs, objects), {
    jobId: "job_wrong_token",
    token: "tok_wrong"
  });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "Unknown or expired conversion.");
});

test("unknown job id is rejected even with a token", async () => {
  const jobs = new Map();
  const response = await post(fakeEnv(jobs), { jobId: "job_does_not_exist", token: "tok_any" });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "Unknown or expired conversion.");
});

test("incomplete job is rejected with the not-ready message", async () => {
  const token = "tok_valid";
  const tokenHash = await sha256(token);
  const jobs = new Map([
    ["job_processing", completeJob("job_processing", tokenHash, { status: "processing" })]
  ]);

  const response = await post(fakeEnv(jobs), { jobId: "job_processing", token });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "The validation report is available after the full export is generated.");
});

test("complete job without a report key is rejected", async () => {
  const token = "tok_valid";
  const tokenHash = await sha256(token);
  const jobs = new Map([
    ["job_no_report", completeJob("job_no_report", tokenHash, { validation_report_key: "" })]
  ]);

  const response = await post(fakeEnv(jobs), { jobId: "job_no_report", token });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "No validation report is attached to this conversion.");
});

test("correct token streams the validation report with private no-store headers", async () => {
  const token = "tok_valid";
  const tokenHash = await sha256(token);
  const jobs = new Map([[ "job_stream", completeJob("job_stream", tokenHash) ]]);
  const objects = new Map([[ "jobs/job_stream/validation-report.txt", REPORT_TEXT ]]);

  const response = await post(fakeEnv(jobs, objects), { jobId: "job_stream", token });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(
    response.headers.get("content-disposition"),
    'attachment; filename="aiconverter-May-Statement-validation-report.txt"'
  );
  assert.equal(response.headers.get("cache-control"), "no-store, private");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, noarchive, nosnippet");
  assert.equal(await response.text(), REPORT_TEXT);
});

test("missing bucket object (zero bucket reads) is rejected as expired", async () => {
  const token = "tok_valid";
  const tokenHash = await sha256(token);
  const jobs = new Map([[ "job_expired_object", completeJob("job_expired_object", tokenHash) ]]);
  // objects map deliberately empty: the report key exists on the job but the
  // bucket returns nothing for it.

  const response = await post(fakeEnv(jobs), { jobId: "job_expired_object", token });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "The validation report has expired.");
});
