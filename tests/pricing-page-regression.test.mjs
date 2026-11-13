import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import data from "../src/data/converters.json" with { type: "json" };

const pricingHtml = readFileSync("public/pricing/index.html", "utf8");
const pricingMarkdown = readFileSync("public/pricing/index.md", "utf8");
const middleware = readFileSync("functions/_middleware.js", "utf8");

test("pricing page JSON-LD offers match the pricing source", () => {
  const offers = [...pricingHtml.matchAll(/\{\s*"@type": "Offer",\s*"name": "([^"]+)",\s*"price": "([^"]+)",\s*"priceCurrency": "([^"]+)",\s*"description": "([^"]+)"/g)];
  assert.equal(offers.length, data.pricing.length, "JSON-LD should list one offer per plan");

  for (const plan of data.pricing) {
    const offer = offers.find(([, name]) => name === plan.name);
    assert.ok(offer, `JSON-LD offer for ${plan.name} not found`);
    const [, , price, currency, description] = offer;
    assert.equal(price, String(plan.amount / 100), `${plan.name} offer price should be ${plan.amount / 100}`);
    assert.equal(currency, "INR", `${plan.name} offer currency should be INR`);
    assert.equal(description, `${plan.pages} pages or images`, `${plan.name} offer description should match the source detail`);
  }
});

test("agent markdown negotiation serves the pricing route", () => {
  const block = middleware.match(/const pricingMarkdown = `([\s\S]*?)`;/);
  assert.ok(block, "middleware should define the pricing markdown block");
  assert.equal(block[1].trim(), pricingMarkdown.trim(), "middleware pricing markdown should stay byte-identical to public/pricing/index.md");
  assert.match(middleware, /\["\/pricing", pricingMarkdown\]/);
  assert.match(middleware, /- \[pricing page\]\(\/pricing\/\)/);
});
