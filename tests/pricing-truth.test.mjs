import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const middleware = readFileSync(new URL("../functions/_middleware.js", import.meta.url), "utf8");
const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
const bankPage = readFileSync(new URL("../public/bank-statement-pdf-to-csv/index.html", import.meta.url), "utf8");

test("frontend blocks checkout when live pricing preview is unavailable", () => {
  assert.match(source, /function checkoutPricingBlock/);
  assert.match(source, /Live checkout pricing is unavailable right now/);
  assert.match(source, /disabled=\{[\s\S]*checkoutPricingBlock\(pricingPreview\)/);
  assert.doesNotMatch(source, /planById\(planId\)\?\.price/);
  assert.doesNotMatch(source, /plan\?\.price/);
  assert.doesNotMatch(source, /\|\| "₹399"/);
});

test("agent-readable and static public pricing use live checkout preview wording", () => {
  for (const text of [middleware, llms, bankPage]) {
    assert.match(text, /live (Dodo )?checkout preview/i);
    assert.doesNotMatch(text, /₹399|₹799|₹1,399/);
  }
});
