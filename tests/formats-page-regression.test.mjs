import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("formats page still renders populated results when options match", () => {
  assert.match(source, /visiblePairs\.length \?/);
  assert.match(source, /visiblePairs\.map\(\(pair\) =>/);
  assert.match(source, /className=\{classNames\("format-card"/);
});

test("formats page renders a recovery state when no options match the search or category", () => {
  assert.match(source, /formats-empty/);
  assert.match(source, /No formats match your search and filters/);
  assert.match(source, /Try a different search term/);
  assert.match(source, /role="status"/);
  assert.match(source, /Clear search and filters/);
  assert.match(source, /setQuery\(""\)/);
  assert.match(source, /setCategory\("Available"\)/);
  assert.match(source, /searchInputRef\.current\?\.focus\(\)/);
  assert.match(source, /secondary-button/);
  assert.match(source, /RefreshCw size=\{16\}/);
});
