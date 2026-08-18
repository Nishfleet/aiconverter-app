import test from "node:test";
import assert from "node:assert/strict";
import {
  enforceJobExpiry,
  resultExpired,
  SOURCE_RETENTION_SECONDS,
  sourceExpired
} from "../functions/lib/jobs.js";

function makeJob(overrides = {}) {
  return {
    id: "job_expiry_1",
    status: "complete",
    source_key: "sources/job_expiry_1/source.pdf",
    preview_key: "jobs/job_expiry_1/preview.csv",
    result_key: "jobs/job_expiry_1/result.csv",
    validation_report_key: "jobs/job_expiry_1/validation.txt",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  };
}

function makeEnv({ failKeys = new Set(), failUpdate = false } = {}) {
  const deletes = [];
  const updates = [];
  const state = { failKeys, failUpdate };
  const env = {
    AICONVERTER_BUCKET: {
      delete: async (key) => {
        deletes.push(key);
        if (state.failKeys.has(key)) throw new Error(`R2 delete failed for ${key}`);
      }
    },
    AICONVERTER_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              run: async () => {
                if (state.failUpdate) throw new Error("DB update failed");
                updates.push({ sql, values });
              }
            };
          }
        };
      }
    }
  };
  return { env, deletes, updates, state };
}

test("resultExpired is true only once the result retention window has passed", () => {
  const now = Date.now();
  assert.equal(resultExpired(makeJob({ expires_at: new Date(now + 60_000).toISOString() }), now), false);
  assert.equal(resultExpired(makeJob({ expires_at: new Date(now - 1_000).toISOString() }), now), true);
  assert.equal(resultExpired(makeJob({ expires_at: "" }), now), false);
});

test("sourceExpired is true only after the 24h source retention window without a deletion marker", () => {
  const now = Date.now();
  const old = new Date(now - (SOURCE_RETENTION_SECONDS * 1000 + 60_000)).toISOString();
  const fresh = new Date(now - 60_000).toISOString();
  assert.equal(sourceExpired(makeJob({ created_at: old }), now), true);
  assert.equal(sourceExpired(makeJob({ created_at: fresh }), now), false);
  assert.equal(sourceExpired(makeJob({ created_at: old, source_deleted_at: now }), now), false);
});

test("expiry sweep deletes every stored object and marks an expired-result job expired", async () => {
  const job = makeJob({
    expires_at: new Date(Date.now() - 60_000).toISOString()
  });
  const { env, deletes, updates } = makeEnv();

  const result = await enforceJobExpiry(env, job);

  assert.equal(result, null, "expired-result branch returns null (fire-and-forget sweep)");
  assert.deepEqual(deletes.sort(), [
    `jobs/${job.id}/preview.csv`,
    `jobs/${job.id}/result.csv`,
    `sources/${job.id}/source.pdf`
  ]);
  assert.equal(updates.length, 1);
  assert.match(updates[0].sql, /status = \?/);
  assert.ok(updates[0].values.includes("expired"), "DB row marked expired");
  assert.ok(updates[0].values.includes("This conversion has expired."), "expiry error persisted");
  assert.ok(
    updates[0].values.some((value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)),
    "source_deleted_at persisted"
  );
});

test("source-only expiry sweeps just the source object and leaves the job status alone", async () => {
  const job = makeJob({
    created_at: new Date(Date.now() - (SOURCE_RETENTION_SECONDS * 1000 + 60_000)).toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  const { env, deletes, updates } = makeEnv();

  const result = await enforceJobExpiry(env, job);

  assert.equal(result.status, "complete", "job status must not change on source-only expiry");
  assert.ok(result.source_deleted_at);
  assert.deepEqual(deletes, [`sources/${job.id}/source.pdf`]);
  assert.equal(updates.length, 1);
  const statusValue = updates[0].values.find((value) => typeof value === "string" && value.startsWith("2"));
  assert.ok(!statusValue || statusValue === result.source_deleted_at, "only source_deleted_at persisted");
});

test("non-expired jobs are returned untouched with no bucket or DB writes", async () => {
  const job = makeJob();
  const { env, deletes, updates } = makeEnv();

  const result = await enforceJobExpiry(env, job);

  assert.equal(result, job);
  assert.equal(deletes.length, 0);
  assert.equal(updates.length, 0);
});

test("source-only expiry does not stamp source_deleted_at when the R2 delete fails", async () => {
  const job = makeJob({
    created_at: new Date(Date.now() - (SOURCE_RETENTION_SECONDS * 1000 + 60_000)).toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  const { env, deletes, updates } = makeEnv({ failKeys: new Set([job.source_key]) });

  const result = await enforceJobExpiry(env, job);

  assert.equal(result.expiryCompleted, false, "sweep must report it did not complete");
  assert.deepEqual(result.failedKeys, [job.source_key]);
  assert.ok(!result.source_deleted_at, "source_deleted_at must not be stamped");
  assert.equal(result.status, "complete", "job status must be untouched");
  assert.equal(updates.length, 0, "no DB write means the job row stays retryable");
  assert.deepEqual(deletes, [job.source_key], "the source delete was still attempted");
});

test("result expiry does not mark the job expired when any required R2 delete fails", async () => {
  const job = makeJob({ expires_at: new Date(Date.now() - 60_000).toISOString() });
  const failingKey = `jobs/${job.id}/result.csv`;
  const { env, deletes, updates } = makeEnv({ failKeys: new Set([failingKey]) });

  const result = await enforceJobExpiry(env, job);

  assert.notEqual(result, null, "a failed sweep must not look like a completed fire-and-forget sweep");
  assert.equal(result.expiryCompleted, false, "sweep must report it did not complete");
  assert.deepEqual(result.failedKeys, [failingKey]);
  assert.equal(result.status, "complete", "status must not become expired");
  assert.ok(!result.source_deleted_at, "source_deleted_at must not be stamped");
  assert.equal(result.source_key, job.source_key, "source pointer preserved for retry");
  assert.equal(result.preview_key, job.preview_key, "preview pointer preserved for retry");
  assert.equal(result.result_key, job.result_key, "result pointer preserved for retry");
  assert.equal(updates.length, 0, "no DB write on a failed sweep");
  assert.deepEqual(
    deletes.sort(),
    [`jobs/${job.id}/preview.csv`, `jobs/${job.id}/result.csv`, `sources/${job.id}/source.pdf`],
    "every stored object was still attempted"
  );
});

test("result expiry with every R2 delete failing leaves the job row untouched", async () => {
  const job = makeJob({ expires_at: new Date(Date.now() - 60_000).toISOString() });
  const { env, deletes, updates } = makeEnv({
    failKeys: new Set([
      `sources/${job.id}/source.pdf`,
      `jobs/${job.id}/preview.csv`,
      `jobs/${job.id}/result.csv`
    ])
  });

  const result = await enforceJobExpiry(env, job);

  assert.notEqual(result, null, "a failed sweep must not look like a completed fire-and-forget sweep");
  assert.equal(result.expiryCompleted, false);
  assert.deepEqual(
    result.failedKeys.sort(),
    [`jobs/${job.id}/preview.csv`, `jobs/${job.id}/result.csv`, `sources/${job.id}/source.pdf`]
  );
  assert.equal(result.status, "complete", "status must not become expired");
  assert.ok(!result.source_deleted_at, "source_deleted_at must not be stamped");
  assert.equal(updates.length, 0, "no DB write on a failed sweep");
  assert.equal(deletes.length, 3, "all three deletes were attempted");
});

test("expiry sweep retries and completes once R2 is healthy again", async () => {
  const job = makeJob({
    created_at: new Date(Date.now() - (SOURCE_RETENTION_SECONDS * 1000 + 60_000)).toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  const { env, deletes, updates, state } = makeEnv({ failKeys: new Set([job.source_key]) });

  const first = await enforceJobExpiry(env, job);
  assert.equal(first.expiryCompleted, false);
  assert.equal(updates.length, 0, "the failed attempt must not be recorded as complete");

  state.failKeys.clear();
  const second = await enforceJobExpiry(env, job);

  assert.ok(second.source_deleted_at, "retry stamps source_deleted_at");
  assert.equal(second.status, "complete", "source-only sweep keeps the job status");
  assert.equal(updates.length, 1);
  assert.equal(deletes.length, 2, "retry re-attempted the delete");
});

test("expiry sweep fails closed and is retryable when the DB update fails", async () => {
  const job = makeJob({
    created_at: new Date(Date.now() - (SOURCE_RETENTION_SECONDS * 1000 + 60_000)).toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  const { env, updates, state } = makeEnv({ failUpdate: true });

  await assert.rejects(
    enforceJobExpiry(env, job),
    /DB update failed/,
    "DB update failure must propagate instead of being swallowed"
  );
  assert.equal(updates.length, 0, "no partial record was written");

  state.failUpdate = false;
  const result = await enforceJobExpiry(env, job);

  assert.ok(result.source_deleted_at, "retry completes the sweep");
  assert.equal(updates.length, 1);
});
