import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("pre-upload workspace offers a non-bank recovery path to the formats catalog", () => {
  assert.match(source, /Not a bank statement\?/);
  assert.match(source, /Browse all conversion options/);
  assert.match(source, /href="\/formats\/"/);
  assert.match(source, /accepts every file type this app is configured for/);
  assert.match(source, /only offers pairs that\s+are actually supported/);
});

test("recovery examples are derived from available catalog pairs and exclude the bank route", () => {
  assert.match(source, /const recoveryExamples = useMemo/);
  assert.match(source, /conversionCatalog\.filter\(\(pair\) => pair\.available\)/);
  assert.match(source, /request\.converterId === "bank"\) continue;/);
  assert.match(source, /if \(examples\.length >= 6\) break;/);
});

test("recovery note sits inside the pre-upload workspace after the upload grid and before the guardrails", () => {
  const uploadGrid = source.indexOf('className="hero-lab-grid"');
  const recovery = source.indexOf("Not a bank statement?");
  const guardrails = source.indexOf('className="quiet-benefits"');
  assert.ok(uploadGrid !== -1, "upload grid should exist");
  assert.ok(recovery !== -1, "recovery note should exist");
  assert.ok(guardrails !== -1, "guardrails row should exist");
  assert.ok(recovery > uploadGrid, "recovery note should come after the upload grid");
  assert.ok(recovery < guardrails, "recovery note should come before the guardrails row");
});

test("bank upload CTA and file input semantics remain unchanged", () => {
  assert.match(source, /Upload a bank statement for a private preview/);
  assert.match(source, /accept=\{allAcceptedTypes\(selectableConverters\)\}/);
  assert.match(source, /type="file"/);
  assert.match(source, /multiple/);
});

test("recovery note has base and narrow-screen styles", () => {
  assert.match(css, /\.recovery-note \{/);
  assert.match(css, /\.recovery-note-link \{/);
  assert.match(css, /\.recovery-example-chip \{/);
  const narrowQuery = css.slice(css.indexOf("@media (max-width: 640px)"));
  assert.match(narrowQuery, /\.recovery-note \{\s*flex-direction: column/s);
});
