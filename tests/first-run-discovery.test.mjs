import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const middleware = readFileSync(new URL("../functions/_middleware.js", import.meta.url), "utf8");

function stripMarkup() {
  const start = source.indexOf('className="route-discovery"');
  const end = source.indexOf('className="quiet-benefits"');
  assert.ok(start !== -1 && end !== -1 && start < end, "route discovery strip renders before the guardrail row");
  return source.slice(start, end);
}

test("non-bank routes appear before file selection with the bank CTA still primary", () => {
  const uploadTarget = source.indexOf("Upload a bank statement for a private preview");
  const strip = source.indexOf('className="route-discovery"');
  assert.ok(uploadTarget !== -1 && strip > uploadTarget, "bank upload CTA stays primary above the strip");
  const branchStarts = [...source.matchAll(/\{!file && \(/g)].map((match) => match.index);
  assert.ok(branchStarts.length >= 3, "pre-upload branch renders in multiple blocks");
  assert.ok(branchStarts[1] < strip && strip < branchStarts[2], "strip lives inside the !file pre-upload branch");
});

test("strip lists the four intent categories with crawlable, keyboard-usable anchors", () => {
  const strip = stripMarkup();
  assert.match(source, /const FORMATS_ROUTE = "\/formats\/"/, "cards link to the existing formats route");
  const examples = source.match(/const PRE_UPLOAD_ROUTE_EXAMPLES = \[([\s\S]*?)\n\];/)?.[1] || "";
  for (const label of ["Bank statements", "Receipts & invoices", "Screenshots & documents", "Audio, media & archives"]) {
    assert.match(examples, new RegExp(`label: "${label.replace(/&/g, "&")}"`), `data source includes ${label}`);
  }
  assert.equal((examples.match(/label: "/g) || []).length, 4, "strip exposes four route cards");
  assert.equal((strip.match(/<a className="route-discovery-card" href=\{FORMATS_ROUTE\} key=\{route\.label\}>/g) || []).length, 1, "cards render from one plain-anchor map template");
  assert.match(strip, /<RouteIcon size=\{17\} \/>/, "cards render through a plain anchor with no onClick");
  assert.match(strip, />See all conversion options</);
  const allHrefs = [...strip.matchAll(/href=(?:"([^"]+)"|\{([A-Z_]+)\})/g)].map((match) => match[1] || `{${match[2]}}`);
  assert.equal(allHrefs.length, 2, "strip markup contains the card-template anchor and the note anchor");
  assert.ok(allHrefs.every((href) => href === "/formats/" || href === "{FORMATS_ROUTE}"), "no strip link points elsewhere");
  assert.equal((examples.match(/label: "/g) || []).length, 4, "rendered cards all come from the 4-item route examples list");
});

test("/formats/ is crawlable for the links it exposes", () => {
  assert.match(middleware, /\["\/formats", formatsMarkdown\]/, "crawlers get a real markdown page for /formats");
});

test("strip copy matches the catalog and the /formats/ truth rule", () => {
  const flat = stripMarkup().replace(/\s+/g, " ");
  const examples = source.match(/const PRE_UPLOAD_ROUTE_EXAMPLES = \[([\s\S]*?)\n\];/)?.[1] || "";
  assert.match(flat, /Exact input and output availability is checked after you select a file/);
  assert.match(flat, /Examples only, not promises — not every file type converts to every output/);
  assert.match(examples, /PDF to accounting CSV presets/, "bank card detail matches the live bank converter");
  assert.match(examples, /Images and PDFs to expense CSV or JSON/, "receipt/invoice card detail matches the catalog");
  assert.match(examples, /Tables to CSV, docs to Markdown, screenshots to HTML/, "screenshot/document card detail matches the catalog");
  assert.match(examples, /Transcripts, format swaps, and more/, "audio/media card detail avoids promising every output");
  assert.ok(!/converts (anything|any file|all files)/.test(`${flat} ${examples}`), "strip never promises blanket conversion");
});

test("strip styles exist and expose a visible focus state", () => {
  assert.match(styles, /\.route-discovery \{/);
  assert.match(styles, /\.route-discovery-card:focus-visible \{/);
  assert.match(styles, /\.route-discovery-grid \{/);
  assert.match(styles, /@media \(max-width: 640px\)/);
});
