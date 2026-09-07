import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost as dodoPriceSync } from "../functions/api/admin/dodo-prices.js";

const ADMIN_TOKEN = "a".repeat(32);
const ADMIN_BEARER = `Bearer ${ADMIN_TOKEN}`;
const ENDPOINT = "https://aiconverter.app/api/admin/dodo-prices";

function fakeEnv(overrides = {}) {
  return {
    ADMIN_TOKEN,
    DODO_PAYMENTS_API_KEY: "dodo_test",
    DODO_PRODUCT_STARTER_ID: "prod_starter",
    DODO_PRODUCT_BATCH_ID: "prod_batch",
    DODO_PRODUCT_PRO_ID: "prod_pro",
    ...overrides
  };
}

function post(body, { bearer = ADMIN_BEARER, env } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (bearer !== null) headers.Authorization = bearer;
  return dodoPriceSync({
    env: env || fakeEnv(),
    request: new Request(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    })
  });
}

function guardFetch(failOnCall = true) {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (...args) => {
    calls += 1;
    if (failOnCall) throw new Error(`Unexpected Dodo call: ${String(args[0])}`);
    return Response.json({ price: 39900, currency: "INR" });
  };
  return {
    calls: () => calls,
    restore() {
      globalThis.fetch = originalFetch;
    }
  };
}

test("admin dodo price sync returns 401 with zero price-sync calls when credentials are missing", async () => {
  const guard = guardFetch();
  try {
    const response = await post({}, { bearer: null });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "Unauthorized.");
    assert.equal(guard.calls(), 0, "no Dodo price-sync call may happen without admin credentials");
  } finally {
    guard.restore();
  }
});

test("admin dodo price sync returns 401 with zero price-sync calls for wrong credentials", async () => {
  const guard = guardFetch();
  try {
    const response = await post({}, { bearer: "Bearer wrong-token" });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "Unauthorized.");
    assert.equal(guard.calls(), 0, "no Dodo price-sync call may happen with wrong credentials");

    const env = fakeEnv();
    const viaHeader = await dodoPriceSync({
      env,
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": "wrong-token" },
        body: "{}"
      })
    });
    assert.equal(viaHeader.status, 401);
    assert.equal(guard.calls(), 0, "no Dodo price-sync call may happen with a wrong X-Admin-Token");
  } finally {
    guard.restore();
  }
});

test("admin dodo price sync permits dry-run only with correct credentials", async () => {
  const guard = guardFetch();
  try {
    const response = await post({});
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.dryRun, true);
    assert.equal(payload.baseUrl, "https://live.dodopayments.com");
    assert.equal(payload.updates.length, 3);
    assert.deepEqual(
      payload.updates.map((update) => update.planId).sort(),
      ["batch", "pro", "starter"]
    );
    assert.ok(
      payload.updates.every((update) => update.productId === `prod_${update.planId}`),
      "dry-run lists the configured Dodo product ids"
    );
    assert.equal(guard.calls(), 0, "dry-run must not call the Dodo API");
  } finally {
    guard.restore();
  }
});

test("admin dodo price sync returns 400 with zero price-sync calls when live update lacks the exact confirmation text", async () => {
  const guard = guardFetch();
  try {
    const response = await post({ dryRun: false, confirm: "sync-inr" });
    assert.equal(response.status, 400);
    assert.match(
      (await response.json()).error,
      /Set confirm to sync-inr-prices to update live Dodo prices/
    );
    assert.equal(guard.calls(), 0, "no Dodo price-sync call may happen without the exact confirmation text");
  } finally {
    guard.restore();
  }
});

test("admin dodo price sync performs the live update only with correct credentials and the exact confirmation text", async () => {
  const guard = guardFetch(false);
  try {
    const response = await post({ dryRun: false, confirm: "sync-inr-prices" });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.dryRun, false);
    assert.equal(payload.results.length, 3);
    assert.ok(payload.results.every((result) => result.ok));
    assert.ok(
      payload.results.every((result) => result.price === 39900),
      "live update returns the price echoed by Dodo"
    );
    assert.equal(guard.calls(), 3, "a confirmed live update patches all three products");
  } finally {
    guard.restore();
  }
});

test("admin dodo price sync route rejects GET", async () => {
  const response = await onRequestGet();
  assert.equal(response.status, 405);
  assert.match((await response.json()).error, /Method not allowed/);
  assert.equal(response.headers.get("Allow"), "POST");
});
