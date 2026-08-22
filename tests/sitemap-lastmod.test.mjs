import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sitemap = readFileSync("public/sitemap.xml", "utf8");

test("every sitemap URL has a lastmod date", () => {
  const entries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)];
  assert.equal(entries.length, locs.length, "every <loc> should have a matching <lastmod>");
});

test("lastmod dates are valid ISO 8601 date format", () => {
  const dates = [...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map((m) => m[1]);
  assert.ok(dates.length > 0, "sitemap should have at least one lastmod entry");
  for (const date of dates) {
    const parsed = new Date(date);
    assert.ok(!isNaN(parsed.getTime()), `${date} should be a valid date`);
  }
});

test("sitemap is well-formed XML with urlset root", () => {
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, /<\/urlset>\n$/);
});
