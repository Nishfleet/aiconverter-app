import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const receiptPage = readFileSync(new URL("../public/receipt-to-csv/index.html", import.meta.url), "utf8");

test("converter intent is read from the ?converter= URL param on load", () => {
  assert.match(source, /URLSearchParams\(window\.location\.search\)\.get\("converter"\)/);
  assert.match(source, /isLiveConverter\(converter\)/);
});

test("preselected converter intent wins over the bank default", () => {
  assert.match(source, /useState\(\(\) => intentConverterIdFromUrl\(\) \|\| "bank"\)/);
});

test("unknown or upcoming converters fall back to the bank default", () => {
  const helperStart = source.indexOf("function intentConverterIdFromUrl");
  assert.notEqual(helperStart, -1, "expected intentConverterIdFromUrl helper in main.jsx");
  const helperBlock = source.slice(helperStart, source.indexOf("\nfunction ", helperStart + 10));
  assert.match(helperBlock, /data\.converters\.find/);
  assert.match(helperBlock, /candidate\.id === requested/);
});

test("receipt landing page CTAs deep-link to the receipt preselected converter", () => {
  assert.match(receiptPage, /href="\/\?converter=receipt">Open converter</);
  assert.match(receiptPage, /href="\/\?converter=receipt">try a real receipt in the converter<\/a>/);
});

test("receipt landing brand link stays the plain home URL", () => {
  assert.match(receiptPage, /<a class="brand" href="\/" aria-label="AI Converter home">/);
});

test("bank landing pages keep the bare home URL for the open-converter CTA", () => {
  const bankPage = readFileSync(
    new URL("../public/bank-statement-pdf-to-csv/index.html", import.meta.url),
    "utf8"
  );
  assert.match(bankPage, /<a class="top-link" href="\/">Open converter<\/a>/);
});

test("the no-file upload target reflects the preselected converter", () => {
  assert.match(source, /selected\.title} → \{selected\.output\}/);
  assert.match(source, /Bank statement → accounting CSV/);
});
