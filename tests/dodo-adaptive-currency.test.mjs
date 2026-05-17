import test from "node:test";
import assert from "node:assert/strict";
import { createDodoCheckout, isDodoPaymentAmountTooLow, previewDodoPlanPrices, syncDodoProductPrices } from "../functions/lib/dodo.js";
import { PLANS } from "../functions/lib/jobs.js";

test("Dodo pricing preview returns Dodo-calculated local totals", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const responses = {
    prod_starter_in: { currency: "INR", current_breakup: { total_amount: 29900 }, billing_country: "IN" },
    prod_batch_in: { currency: "INR", current_breakup: { total_amount: 59900 }, billing_country: "IN" },
    prod_pro_in: { currency: "INR", current_breakup: { total_amount: 109900 }, billing_country: "IN" }
  };

  globalThis.fetch = async (url, options = {}) => {
    const body = JSON.parse(options.body);
    calls.push({ url: String(url), headers: options.headers, body });
    return Response.json(responses[body.product_cart[0].product_id]);
  };

  try {
    const preview = await previewDodoPlanPrices({
      env: {
        DODO_PAYMENTS_API_KEY: "dodo_test",
        DODO_PRODUCT_STARTER_ID: "prod_starter_in",
        DODO_PRODUCT_BATCH_ID: "prod_batch_in",
        DODO_PRODUCT_PRO_ID: "prod_pro_in"
      },
      request: new Request("https://aiconverter.app/api/pricing-preview", {
        headers: { "CF-IPCountry": "IN" }
      })
    });

    assert.equal(preview.available, true);
    assert.equal(preview.provider, "dodo");
    assert.equal(preview.prices.starter.currency, "INR");
    assert.equal(preview.prices.starter.amount, 29900);
    assert.match(preview.prices.starter.display, /299/);
    assert.doesNotMatch(preview.prices.starter.display, /\./);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].url, "https://live.dodopayments.com/checkouts/preview");
    assert.equal(calls[0].headers.Authorization, "Bearer dodo_test");
    assert.equal(calls[0].body.billing_address.country, "IN");
    assert.equal("adaptive_currency_fees_inclusive" in calls[0].body, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Dodo checkout requests fee-inclusive adaptive currency", async () => {
  const originalFetch = globalThis.fetch;
  let checkoutBody;
  globalThis.fetch = async (_url, options = {}) => {
    checkoutBody = JSON.parse(options.body);
    return Response.json({
      session_id: "cks_test",
      checkout_url: "https://checkout.dodopayments.com/session/cks_test"
    });
  };

  const updates = [];
  const env = {
    DODO_PAYMENTS_API_KEY: "dodo_test",
    DODO_PRODUCT_STARTER_ID: "prod_starter",
    DODO_CURRENCY: "INR",
    AICONVERTER_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            updates.push({ sql, values });
            return { run: async () => ({ success: true }) };
          }
        };
      }
    }
  };

  try {
    const checkoutUrl = await createDodoCheckout({
      env,
      request: new Request("https://aiconverter.app/api/checkout", {
        headers: { "CF-IPCountry": "AU" }
      }),
      job: { id: "job_123" },
      plan: PLANS.starter,
      email: "customer@example.com"
    });

    assert.equal(checkoutUrl, "https://checkout.dodopayments.com/session/cks_test");
    assert.equal(checkoutBody.adaptive_currency_fees_inclusive, true);
    assert.equal(checkoutBody.billing_address.country, "AU");
    assert.equal(checkoutBody.customer.email, "customer@example.com");
    assert.equal(checkoutBody.metadata.expected_amount, "29900");
    assert.equal(checkoutBody.metadata.expected_currency, "INR");
    assert.equal(updates.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adaptive currency payments are not rejected as underpaid local minor units", () => {
  assert.equal(
    isDodoPaymentAmountTooLow({}, { amount: 250, currency: "INR" }, PLANS.starter),
    false
  );
  assert.equal(
    isDodoPaymentAmountTooLow({}, { amount: 250, currency: "USD" }, PLANS.starter),
    true
  );
  assert.equal(
    isDodoPaymentAmountTooLow({ DODO_ADAPTIVE_CURRENCY: "false", DODO_CURRENCY: "INR" }, { amount: 250, currency: "INR" }, PLANS.starter),
    true
  );
});

test("Dodo product price sync patches INR one-time prices", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), headers: options.headers, body: JSON.parse(options.body) });
    return Response.json({ price: JSON.parse(options.body).price });
  };

  try {
    const result = await syncDodoProductPrices({
      DODO_PAYMENTS_API_KEY: "dodo_test",
      DODO_PRODUCT_STARTER_ID: "prod_starter",
      DODO_PRODUCT_BATCH_ID: "prod_batch",
      DODO_PRODUCT_PRO_ID: "prod_pro"
    });

    assert.equal(result.ok, true);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].url, "https://live.dodopayments.com/products/prod_starter");
    assert.equal(calls[0].headers.Authorization, "Bearer dodo_test");
    assert.deepEqual(calls.map((call) => call.body.price.price), [29900, 59900, 109900]);
    assert.deepEqual(calls.map((call) => call.body.price.currency), ["INR", "INR", "INR"]);
    assert.deepEqual(calls.map((call) => call.body.price.purchasing_power_parity), [true, true, true]);
    assert.deepEqual(calls.map((call) => call.body.price.type), ["one_time_price", "one_time_price", "one_time_price"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
