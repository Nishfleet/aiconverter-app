import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("first-run discovery keeps the bank-statement preview as the default starting point", () => {
  assert.match(source, /Choose your starting point/);
  assert.match(source, /Upload a bank statement for a private preview/);
});

test("catalog exploration reaches /formats/ as a real link without uploading", () => {
  assert.match(source, /<a className="catalog-explore-card" href="\/formats\/">/);
  assert.match(source, /Browse all conversion options/);
});

test("catalog boundary language stays honest about supported pairs", () => {
  assert.match(source, /only the pairs the live app supports today/);
});
