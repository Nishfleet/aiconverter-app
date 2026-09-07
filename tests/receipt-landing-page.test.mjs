import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/receipt-to-csv/index.html", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const convertersJson = JSON.parse(
  readFileSync(new URL("../src/data/converters.json", import.meta.url), "utf8")
);

const receiptConverter = convertersJson.converters.find((converter) => converter.id === "receipt");

test("receipt-to-csv page is indexable and canonical at /receipt-to-csv/", () => {
  assert.match(html, /<meta\s+name="robots"\s+content="index,follow"/);
  assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\/aiconverter\.app\/receipt-to-csv\/"/);
  assert.ok(
    sitemap.includes("<loc>https://aiconverter.app/receipt-to-csv/</loc>"),
    "sitemap.xml should list the receipt-to-csv page"
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "page should have one H1");
});

test("receipt-to-csv copy is grounded in the receipt converter definition", () => {
  assert.ok(receiptConverter, "receipt converter should exist in converters.json");
  assert.match(html, /PNG, JPG, JPEG, WEBP/i, "page should list supported image inputs");
  assert.match(html, /PDF/i, "page should list PDF input");
  assert.match(html, /50 MB/, "page should state the 50 MB limit");
  assert.match(html, /500 pages/, "page should state the PDF page limit");
  assert.match(html, /sample CSV/, "page should mention the free sample preview");
  assert.match(html, /confidence score/, "page should mention the confidence score");
  assert.match(html, /fail(ed)? closed/, "page should describe fail-closed behavior");
  assert.match(html, /vendor and total/i, "page should describe the vendor-and-total gate");
  assert.match(html, /one row per readable page/i, "page should describe per-page row behavior");
});

test("receipt-to-csv lists the real CSV columns from the receipt converter", () => {
  const expectedLabels = receiptConverter.columns.map((column) => column.label);
  assert.ok(expectedLabels.length >= 5, "receipt converter should define CSV columns");
  const lower = html.toLowerCase();
  for (const label of expectedLabels) {
    assert.ok(lower.includes(label.toLowerCase()), `page should mention the "${label}" CSV column`);
  }
});

test("receipt-to-csv does not expose provider names, pricing, or fake sample data", () => {
  const lower = html.toLowerCase();
  for (const provider of ["mistral", "azure", "cloudconvert", "convertio", "openai", "anthropic", "gemini", "workers ai", "google"]) {
    assert.ok(!lower.includes(provider), `page should not name provider "${provider}"`);
  }
  for (const pricing of ["pricing", "price", "₹", "$", "€", "£", "inr", "usd"]) {
    assert.ok(!lower.includes(pricing), `page should not contain pricing copy ("${pricing}")`);
  }
  assert.ok(!/\b\d{1,3}(?:,\d{3})*\.\d{2}\b/.test(html), "page should not fabricate sample amounts");
});

test("receipt-to-csv has a prominent CTA to the real converter", () => {
  assert.match(html, /href="\/#start"/, "page should deep-link to the converter workspace");
  assert.ok((html.match(/href="\//g) || []).length >= 3, "page should expose internal links");
  assert.match(html, /Open the converter/, "page should label its primary CTA");
});
