import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import data from "../src/data/converters.json" with { type: "json" };

const mainJsx = readFileSync("src/main.jsx", "utf8");
const stylesCss = readFileSync("src/styles.css", "utf8");
const pricingHtml = readFileSync("public/pricing/index.html", "utf8");
const pricingMarkdown = readFileSync("public/pricing/index.md", "utf8");
const middleware = readFileSync("functions/_middleware.js", "utf8");
const sitemap = readFileSync("public/sitemap.xml", "utf8");
const llmsTxt = readFileSync("public/llms.txt", "utf8");
const llmsFull = readFileSync("public/llms-full.txt", "utf8");
const checkPricing = readFileSync("scripts/check-pricing.mjs", "utf8");

test("Pricing nav resolves to the /pricing/ route, not an in-page anchor", () => {
  assert.match(mainJsx, /<a href="\/pricing\/">Pricing<\/a>/);
  assert.doesNotMatch(mainJsx, /site-nav[\s\S]*?<a href="#pricing">/);
  assert.match(stylesCss, /\.site-nav a\[href="\/pricing\/"\]/);
});

test("pricing page is a canonical, crawlable static surface", () => {
  assert.match(pricingHtml, /<meta name="robots" content="index,follow"/);
  assert.match(pricingHtml, /<link rel="canonical" href="https:\/\/aiconverter\.app\/pricing\/" \/>/);
  assert.match(pricingHtml, /<link rel="alternate" type="text\/markdown" href="https:\/\/aiconverter\.app\/pricing\/index\.md" \/>/);
  assert.equal((pricingHtml.match(/<h1\b/g) || []).length, 1);
  assert.match(pricingHtml, /application\/ld\+json/);
  assert.match(pricingHtml, /<a class="primary-button" href="\/#start">/);
});

test("pricing page plan totals match the pricing source", () => {
  for (const plan of data.pricing) {
    const expected = `${plan.price} for ${plan.pages} pages`;
    assert.ok(pricingHtml.includes(expected), `pricing page is missing "${expected}"`);
    assert.ok(pricingMarkdown.includes(expected), `pricing markdown is missing "${expected}"`);
  }
});

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

test("pricing route is listed in sitemap and agent docs", () => {
  assert.match(sitemap, /<url><loc>https:\/\/aiconverter\.app\/pricing\/<\/loc><\/url>/);
  assert.match(llmsTxt, /https:\/\/aiconverter\.app\/pricing\//);
  assert.match(llmsFull, /https:\/\/aiconverter\.app\/pricing\//);
});

test("pricing page is guarded by the pricing consistency check", () => {
  assert.match(checkPricing, /public\/pricing\/index\.html/);
  assert.match(checkPricing, /public\/pricing\/index\.md/);
  assert.match(checkPricing, /"price": "/);
});

test("pricing page keeps the truthful boundaries of live behavior", () => {
  // Pack assignment and limits (functions/api/convert.js, functions/api/batch-checkout.js).
  assert.match(pricingHtml, /320&nbsp;KB per page/);
  assert.match(pricingHtml, /PDFs above 500 pages are rejected/);
  assert.match(pricingHtml, /up to 50 previewed files/);
  // Redo is scoped to extraction jobs (functions/api/job.js keeps universal converters out).
  assert.match(pricingHtml, /do not include the automatic redo/);
  // Currency localization (functions/lib/dodo.js adaptive currency).
  assert.match(pricingHtml, /localized\s*total/);
  // Preview honesty: per-job preview is customer data, provider routes show metadata only.
  assert.match(pricingHtml, /rows extracted from\s*your own file/);
  assert.match(pricingHtml, /metadata preview/);
  assert.match(pricingHtml, /fictional sample CSV/);
  // Paid failures go through the recorded refund or credit path, not a blanket "no charge".
  assert.match(pricingHtml, /fails\s*closed/);
  assert.match(pricingHtml, /refund due or\s*credit due/);
  // One-time packs, not subscriptions.
  assert.match(pricingHtml, /one-time page packs/);
});
