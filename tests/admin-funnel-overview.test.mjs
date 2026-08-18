import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { onRequestGet, isActionableUnmatchedPayment } from "../functions/api/admin/overview.js";

const ADMIN_TOKEN = "a".repeat(32);
const ENDPOINT = "https://aiconverter.app/api/admin/overview";

function fakeEnv({ db } = {}) {
  return {
    ADMIN_TOKEN,
    AICONVERTER_BUCKET: {},
    AICONVERTER_DB: db
  };
}

// Counts every AICONVERTER_DB.prepare call so tests can prove the handler
// never reads the database before an admin credential check passes.
function fakeDb() {
  const reads = [];
  const statement = {
    bind() {
      return statement;
    },
    async all() {
      return { results: [] };
    },
    async first() {
      return {};
    }
  };
  return {
    reads,
    prepare(sql) {
      reads.push(sql);
      return statement;
    }
  };
}

function get({ env, headers = {} } = {}) {
  return onRequestGet({
    env,
    request: new Request(ENDPOINT, { method: "GET", headers })
  });
}

test("admin overview returns 401 with zero database reads when credentials are missing", async () => {
  const db = fakeDb();
  const response = await get({ env: fakeEnv({ db }) });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "Unauthorized.");
  assert.equal(db.reads.length, 0, "no database read may happen without admin credentials");
});

test("admin overview returns 401 with zero database reads for a wrong bearer token", async () => {
  const db = fakeDb();
  const response = await get({
    env: fakeEnv({ db }),
    headers: { Authorization: "Bearer wrong-token" }
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "Unauthorized.");
  assert.equal(db.reads.length, 0, "no database read may happen with a wrong bearer token");
});

test("admin overview returns 401 with zero database reads for a wrong X-Admin-Token header", async () => {
  const db = fakeDb();
  const response = await get({
    env: fakeEnv({ db }),
    headers: { "X-Admin-Token": "wrong-token" }
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "Unauthorized.");
  assert.equal(db.reads.length, 0, "no database read may happen with a wrong X-Admin-Token");
});

test("admin overview serves the dashboard only with valid credentials", async () => {
  const db = fakeDb();
  const response = await get({
    env: fakeEnv({ db }),
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.generatedAt, "string");
  assert.ok(Array.isArray(payload.operationalQueues?.previewErrors) === false);
  assert.equal(payload.operationalQueues?.previewErrors, 0);
  assert.ok(db.reads.length > 0, "valid credentials must reach the database queries");
});

test("admin overview exposes preview funnel counts and safe issue rows", () => {
  const apiSource = readFileSync(new URL("../functions/api/admin/overview.js", import.meta.url), "utf8");
  const adminSource = readFileSync(new URL("../public/admin/admin.js", import.meta.url), "utf8");

  assert.match(apiSource, /FROM preview_funnel_events/);
  assert.match(apiSource, /previewFunnel/);
  assert.match(apiSource, /previewFunnelByRoute/);
  assert.match(apiSource, /previewFunnelIssues/);
  assert.match(apiSource, /previewErrors/);
  assert.match(apiSource, /turnstileFailures/);
  assert.match(apiSource, /customerRefundDue/);
  assert.match(apiSource, /drillRefundDue/);
  assert.match(apiSource, /Drill refund retry needed/);
  // Unmatched-payment noise filter: failed attempts without an app job and
  // zero-amount succeeded sandbox events are excluded from the alert list.
  assert.match(apiSource, /AND COALESCE\(amount, 0\) = 0/);
  assert.match(apiSource, /isNonActionableTestEvent/);

  assert.match(adminSource, /renderFunnel/);
  assert.match(adminSource, /Preview funnel/);
  assert.match(adminSource, /Privacy-safe events only/i);
  assert.match(adminSource, /Preview funnel issues/);
});

test("failed Dodo attempts and zero-amount sandbox events without an app job do not block readiness", () => {
  assert.equal(
    isActionableUnmatchedPayment({
      event_type: "payment.failed",
      status: "failed",
      match_status: "job_not_found",
      job_id: ""
    }),
    false
  );
  // A zero-amount payment.succeeded with no app job is Dodo sandbox/test
  // noise (decision 2026-08-10): no money moved, so it must not alert.
  assert.equal(
    isActionableUnmatchedPayment({
      event_type: "payment.succeeded",
      status: "succeeded",
      match_status: "job_not_found",
      job_id: "",
      amount: 0
    }),
    false
  );
  // Any paid-but-unmatched succeeded event still alerts, including a
  // zero-amount event that carries an app job id.
  assert.equal(
    isActionableUnmatchedPayment({
      event_type: "payment.succeeded",
      status: "succeeded",
      match_status: "job_not_found",
      job_id: "",
      amount: 99900
    }),
    true
  );
  assert.equal(
    isActionableUnmatchedPayment({
      event_type: "payment.succeeded",
      status: "succeeded",
      match_status: "job_not_found",
      job_id: "job_abc",
      amount: 0
    }),
    true
  );
  assert.equal(
    isActionableUnmatchedPayment({
      event_type: "payment.failed",
      status: "failed",
      match_status: "metadata_job_mismatch",
      job_id: ""
    }),
    true
  );
});
