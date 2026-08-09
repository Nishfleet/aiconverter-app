import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pricing from "../src/data/converters.json" with { type: "json" };

const pricingPage = readFileSync(new URL("../public/pricing/index.html", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");

test("header Pricing navigation resolves to the canonical /pricing/ route", () => {
  assert.doesNotMatch(appSource, /<a href="#pricing">Pricing<\/a>/, "Pricing nav should not point at the in-page anchor");
  assert.match(appSource, /<a href="\/pricing\/">Pricing<\/a>/, "Pricing nav should point at the /pricing/ route");
  assert.match(sitemap, /<loc>https:\/\/aiconverter\.app\/pricing\/<\/loc>/, "pricing page should be listed in the sitemap");
});

test("pricing page shows the current plan totals from the pricing source", () => {
  for (const plan of pricing.pricing) {
    assert.ok(
      pricingPage.includes(`${plan.price} for ${plan.pages} pages`),
      `pricing page should state "${plan.price} for ${plan.pages} pages"`
    );
    assert.ok(pricingPage.includes(plan.name), `pricing page should name the ${plan.name} plan`);
  }
});

test("pricing page is a canonical, crawlable surface with a preview-flow CTA", () => {
  assert.match(pricingPage, /<link rel="canonical" href="https:\/\/aiconverter\.app\/pricing\/" \/>/);
  assert.equal((pricingPage.match(/<h1\b/g) || []).length, 1, "pricing page should have one H1");
  assert.match(pricingPage, /href="\/#start"/, "pricing page CTA should reach the preview flow");
  assert.match(pricingPage, /preview/, "pricing page should state the preview-first boundary");
  assert.match(pricingPage, /application\/ld\+json/, "pricing page should include JSON-LD schema");
});
