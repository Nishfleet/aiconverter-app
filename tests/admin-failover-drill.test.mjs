import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost as failoverDrill } from "../functions/api/admin/failover-drill.js";

const ADMIN_TOKEN = "a".repeat(32);
const ADMIN_BEARER = `Bearer ${ADMIN_TOKEN}`;
const ENDPOINT = "https://aiconverter.app/api/admin/failover-drill";
const CONVERTIO_BASE = "https://api.convertio.co";

function fakeEnv({ jobs = new Map(), objects = new Map() } = {}) {
  return {
    ADMIN_TOKEN,
    CONVERTIO_API_KEY: "convertio_test",
    AICONVERTER_BUCKET: {
      put: async (key, value) => {
        objects.set(key, value);
      },
      head: async (key) => (objects.has(key) ? { key } : null),
      delete: async (key) => {
        objects.delete(key);
      }
    },
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("INSERT INTO jobs")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  const job = {
                    id: values[0],
                    token_hash: values[1],
                    status: values[2],
                    plan_id: values[3],
                    email: values[4],
                    source_key: values[5],
                    result_key: values[6],
                    original_file_name: values[7],
                    file_size: values[8],
                    estimated_pages: values[9],
                    file_hash: values[10],
                    ip_hash: values[11],
                    user_agent_hash: values[12],
                    converter_id: values[13],
                    input_mime_type: values[14],
                    output_format: values[15],
                    accounting_metadata_json: values[16],
                    created_at: values[17],
                    updated_at: values[18],
                    expires_at: values[19]
                  };
                  jobs.set(job.id, job);
                }
              };
            }
          };
        }
        if (sql.startsWith("SELECT * FROM jobs WHERE id = ?")) {
          return {
            bind(id) {
              return {
                first: async () => jobs.get(id) || null
              };
            }
          };
        }
        if (sql.startsWith("UPDATE jobs SET")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  const assignments = sql.match(/SET (.*) WHERE/)?.[1]?.split(", ") || [];
                  const id = values.at(-1);
                  const job = jobs.get(id) || {};
                  assignments.forEach((assignment, index) => {
                    const key = assignment.split(" = ")[0];
                    if (key !== "updated_at") job[key] = values[index];
                  });
                  jobs.set(id, job);
                }
              };
            }
          };
        }
        if (sql.startsWith("INSERT INTO rate_limits")) {
          return {
            bind(...values) {
              return {
                first: async () => ({ count: 1 })
              };
            }
          };
        }
        if (sql.startsWith("SELECT count FROM rate_limits WHERE id = ?")) {
          return {
            bind(id) {
              return {
                first: async () => ({ count: 1 })
              };
            }
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}

function post({ bearer = ADMIN_BEARER, env, body = "{}" } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (bearer !== null) headers.Authorization = bearer;
  return failoverDrill({
    env: env || fakeEnv(),
    request: new Request(ENDPOINT, {
      method: "POST",
      headers,
      body
    })
  });
}

/**
 * Guards every provider network call and counts DB + R2 activity so the 401
 * cases can prove the guard fires before any storage or provider side effect.
 */
function guardSideEffects(env, jobs, objects) {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  let dbCalls = 0;
  let r2Calls = 0;
  globalThis.fetch = async (url, options = {}) => {
    fetchCalls += 1;
    throw new Error(`Unexpected provider call: ${options?.method || "GET"} ${String(url)}`);
  };

  const db = env.AICONVERTER_DB;
  env.AICONVERTER_DB = {
    prepare(sql) {
      dbCalls += 1;
      const prepared = db.prepare(sql);
      const bound = prepared.bind;
      prepared.bind = (...values) => {
        const statement = bound.call(prepared, ...values);
        for (const method of ["run", "first", "all"]) {
          const original = statement[method];
          if (original) {
            statement[method] = async (...args) => {
              dbCalls += 1;
              return original.call(statement, ...args);
            };
          }
        }
        return statement;
      };
      return prepared;
    }
  };

  const bucket = env.AICONVERTER_BUCKET;
  env.AICONVERTER_BUCKET = {
    put: async (...args) => {
      r2Calls += 1;
      return bucket.put(...args);
    },
    head: async (...args) => {
      r2Calls += 1;
      return bucket.head(...args);
    },
    delete: async (...args) => {
      r2Calls += 1;
      return bucket.delete(...args);
    }
  };

  return {
    fetchCalls: () => fetchCalls,
    dbCalls: () => dbCalls,
    r2Calls: () => r2Calls,
    restore() {
      globalThis.fetch = originalFetch;
    }
  };
}

test("admin failover drill returns 401 with zero DB, R2, or provider calls when credentials are missing", async () => {
  const jobs = new Map();
  const objects = new Map();
  const env = fakeEnv({ jobs, objects });
  const guard = guardSideEffects(env, jobs, objects);
  try {
    const response = await post({ env, bearer: null });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "Unauthorized.");
    assert.equal(guard.dbCalls(), 0, "no DB call may happen without admin credentials");
    assert.equal(guard.r2Calls(), 0, "no R2 call may happen without admin credentials");
    assert.equal(guard.fetchCalls(), 0, "no provider call may happen without admin credentials");
    assert.equal(jobs.size, 0, "no job may be created without admin credentials");
    assert.equal(objects.size, 0, "no R2 object may be written without admin credentials");
  } finally {
    guard.restore();
  }
});

test("admin failover drill returns 401 with zero DB, R2, or provider calls for wrong credentials", async () => {
  const jobs = new Map();
  const objects = new Map();
  const env = fakeEnv({ jobs, objects });
  const guard = guardSideEffects(env, jobs, objects);
  try {
    const response = await post({ env, bearer: "Bearer wrong-token" });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "Unauthorized.");
    assert.equal(guard.dbCalls(), 0, "no DB call may happen with wrong credentials");
    assert.equal(guard.r2Calls(), 0, "no R2 call may happen with wrong credentials");
    assert.equal(guard.fetchCalls(), 0, "no provider call may happen with wrong credentials");
    assert.equal(jobs.size, 0, "no job may be created with wrong credentials");
    assert.equal(objects.size, 0, "no R2 object may be written with wrong credentials");

    const viaHeader = await failoverDrill({
      env,
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": "wrong-token" },
        body: "{}"
      })
    });
    assert.equal(viaHeader.status, 401);
    assert.equal((await viaHeader.json()).error, "Unauthorized.");
    assert.equal(guard.dbCalls(), 0, "no DB call may happen with a wrong X-Admin-Token");
    assert.equal(guard.r2Calls(), 0, "no R2 call may happen with a wrong X-Admin-Token");
    assert.equal(guard.fetchCalls(), 0, "no provider call may happen with a wrong X-Admin-Token");
    assert.equal(jobs.size, 0, "no job may be created with a wrong X-Admin-Token");
    assert.equal(objects.size, 0, "no R2 object may be written with a wrong X-Admin-Token");
  } finally {
    guard.restore();
  }
});

test("admin failover drill runs the Convertio drill only with correct credentials", async () => {
  const originalFetch = globalThis.fetch;
  const jobs = new Map();
  const objects = new Map();
  const providerCalls = [];
  globalThis.fetch = async (url, options = {}) => {
    providerCalls.push({ url: String(url), method: options?.method || "GET" });
    if (String(url).startsWith(`${CONVERTIO_BASE}/convert/`) && options?.method === "PUT") {
      return Response.json({ data: { file: "drill-upload" } });
    }
    if (String(url) === `${CONVERTIO_BASE}/convert`) {
      return Response.json({ data: { id: "conv_drill_1" } });
    }
    throw new Error(`Unexpected provider call: ${options?.method || "GET"} ${String(url)}`);
  };

  try {
    const response = await post({
      env: fakeEnv({ jobs, objects }),
      body: JSON.stringify({ waitSeconds: 0 })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.provider, "convertio");
    assert.equal(payload.status, "converting_full");
    assert.equal(payload.completed, false);
    assert.match(payload.message, /routed to Convertio/);
    assert.match(payload.jobId, /^drill/);

    const job = jobs.get(payload.jobId);
    assert.ok(job, "the drill job must be recorded in the DB");
    assert.equal(job.email, "admin-drill@aiconverter.app");
    assert.equal(job.plan_id, "starter");
    assert.equal(job.status, "converting_full");
    assert.equal(job.external_provider, "convertio");
    assert.equal(job.external_job_id, "conv_drill_1");

    assert.ok(
      objects.has(`sources/${payload.jobId}/universal.csv`),
      "the drill source must be written to R2"
    );
    assert.equal(
      providerCalls.length,
      2,
      "exactly the Convertio start and upload calls may happen"
    );
    assert.equal(providerCalls[0].url, `${CONVERTIO_BASE}/convert`);
    assert.equal(providerCalls[1].method, "PUT");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin failover drill route rejects GET", async () => {
  const response = await onRequestGet();
  assert.equal(response.status, 405);
  assert.match((await response.json()).error, /Method not allowed/);
  assert.equal(response.headers.get("Allow"), "POST");
});
