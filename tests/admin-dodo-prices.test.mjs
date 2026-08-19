import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/admin/dodo-prices.js";

// Route-level regression guard for the admin Dodo price-sync operator route
// (functions/api/admin/dodo-prices.js). This is a money-mutating route: it can
// PATCH live Dodo product prices. The guard must fail closed: no credentials
// means no sync, wrong credentials means no sync, correct credentials may only
// dry-run, and a live update additionally requires the exact confirmation
// text. Removing requireAdmin must turn these tests red (sol-sweep finding:
// "Removing requireAdmin from the live Dodo price-sync route leaves all seven
// existing admin tests green, so unauthenticated access to a money-mutating
// operator route has no regression guard.").

const CONFIRM_TEXT = "sync-inr-prices";
const VALID_TOKEN = "a".repeat(32);
const ROUTE_URL = "https://aiconverter.app/api/admin/dodo-prices";
const PRODUCT_IDS = {
  starter: "prod_starter",
  batch: "prod_batch",
  pro: "prod_pro"
};

function adminEnv() {
  return {
    ADMIN_TOKEN: VALID_TOKEN,
    DODO_PAYMENTS_API_KEY: "dodo_test_key",
    DODO_PRODUCT_STARTER_ID: PRODUCT_IDS.starter,
    DODO_PRODUCT_BATCH_ID: PRODUCT_IDS.batch,
    DODO_PRODUCT_PRO_ID: PRODUCT_IDS.pro
  };
}

function postRequest(body, headers = {}) {
  return new Request(ROUTE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

// Wraps globalThis.fetch so the test can prove the route made exactly zero
// Dodo API calls (or exactly the expected live PATCHes). Any unexpected call
// fails the test immediately, which is what makes the requireAdmin-removal
// mutation turn red even for the dry-run-shaped request bodies.
async function withFetchSpy(run, expectedCalls = []) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const call = { url: String(url), method: String(options.method || "GET"), headers: options.headers || {} };
    calls.push(call);
    const expected = expectedCalls.find(
      (want) => want.method === call.method && want.url === call.url
    );
    if (!expected) {
      throw new Error(`unexpected Dodo API call: ${call.method} ${call.url}`);
    }
    return Response.json({ ...expected.body, price: 123456 });
  };
  try {
    const result = await run(calls);
    return result;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function assertZeroDodoCalls(calls) {
  assert.deepEqual(
    calls.map((c) => `${c.method} ${c.url}`),
    [],
    "route must not touch the Dodo API when auth or the confirm gate rejects"
  );
}

test("admin dodo price route rejects GET with 405", async () => {
  const response = onRequestGet();
  assert.equal(response.status, 405);
  const payload = await response.json();
  assert.equal(payload.error, "Method not allowed. Use POST.");
});

test("missing credentials return 401 with zero price-sync calls", async () => {
  // A live-update body is used on purpose: if auth were bypassed, this would
  // fire a real PATCH against Dodo, so the spy also proves the guard blocks it.
  await withFetchSpy(async (calls) => {
    const response = await onRequestPost({
      env: adminEnv(),
      request: postRequest({ dryRun: false, confirm: CONFIRM_TEXT })
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.error, "Unauthorized.");
    assertZeroDodoCalls(calls);
  });
});

test("wrong credentials return 401 with zero price-sync calls", async () => {
  await withFetchSpy(async (calls) => {
    const response = await onRequestPost({
      env: adminEnv(),
      request: postRequest(
        { dryRun: false, confirm: CONFIRM_TEXT },
        { Authorization: `Bearer ${"b".repeat(32)}` }
      )
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.error, "Unauthorized.");
    assertZeroDodoCalls(calls);
  });
});

test("wrong X-Admin-Token credentials return 401 with zero price-sync calls", async () => {
  await withFetchSpy(async (calls) => {
    const response = await onRequestPost({
      env: adminEnv(),
      request: postRequest(
        { dryRun: false, confirm: CONFIRM_TEXT },
        { "X-Admin-Token": "c".repeat(32) }
      )
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.error, "Unauthorized.");
    assertZeroDodoCalls(calls);
  });
});

test("unconfigured admin token fails closed with 503 and zero price-sync calls", async () => {
  await withFetchSpy(async (calls) => {
    const response = await onRequestPost({
      env: { ...adminEnv(), ADMIN_TOKEN: "" },
      request: postRequest({ dryRun: false, confirm: CONFIRM_TEXT })
    });

    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload.error, "Admin token is not configured.");
    assertZeroDodoCalls(calls);
  });
});

test("correct credentials only permit a dry run by default, with zero live calls", async () => {
  for (const body of [{}, { dryRun: true }]) {
    await withFetchSpy(async (calls) => {
      const response = await onRequestPost({
        env: adminEnv(),
        request: postRequest(body, { Authorization: `Bearer ${VALID_TOKEN}` })
      });

      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.ok, true);
      assert.equal(payload.dryRun, true);
      assert.ok(Array.isArray(payload.updates), "dry run must list planned updates");
      assert.equal(payload.updates.length, Object.keys(PRODUCT_IDS).length);
      for (const [planId, productId] of Object.entries(PRODUCT_IDS)) {
        const update = payload.updates.find((u) => u.planId === planId);
        assert.ok(update, `dry run must include plan ${planId}`);
        assert.equal(update.productId, productId);
        assert.equal(update.body.price.currency, "INR");
      }
      assertZeroDodoCalls(calls);
    });
  }
});

test("live update is refused without the exact confirmation text", async () => {
  await withFetchSpy(async (calls) => {
    const response = await onRequestPost({
      env: adminEnv(),
      request: postRequest(
        { dryRun: false, confirm: "wrong-confirm" },
        { Authorization: `Bearer ${VALID_TOKEN}` }
      )
    });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.match(payload.error, new RegExp(`Set confirm to ${CONFIRM_TEXT} to update live Dodo prices\\.`));
    assertZeroDodoCalls(calls);
  });
});

test("live update fires only with the exact confirmation text", async () => {
  const expected = Object.entries(PRODUCT_IDS).map(([, productId]) => ({
    method: "PATCH",
    url: `https://live.dodopayments.com/products/${productId}`
  }));
  await withFetchSpy(async (calls) => {
    const response = await onRequestPost({
      env: adminEnv(),
      request: postRequest(
        { dryRun: false, confirm: CONFIRM_TEXT },
        { Authorization: `Bearer ${VALID_TOKEN}` }
      )
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.dryRun, false);
    assert.ok(Array.isArray(payload.results), "live sync must report per-product results");
    assert.equal(payload.results.length, Object.keys(PRODUCT_IDS).length);
    for (const result of payload.results) {
      assert.equal(result.ok, true);
      assert.equal(result.price, 123456);
    }
    // Exactly one PATCH per product and nothing else.
    assert.deepEqual(
      calls.map((c) => `${c.method} ${c.url}`).sort(),
      expected.map((e) => `${e.method} ${e.url}`).sort()
    );
    assert.equal(calls.length, Object.keys(PRODUCT_IDS).length);
  }, expected);
});
