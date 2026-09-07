import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("formats page renders a recovery state when no formats match", () => {
  assert.match(source, /const visiblePairs = useMemo/);
  assert.match(source, /visiblePairs\.length \?/);
  assert.match(source, /className="formats-empty" role="status"/);
  assert.match(source, /<h2>No formats found<\/h2>/);
  assert.match(source, /No formats match "\$\{query\}"/);
  assert.match(source, /No conversion options are available in \$\{category\} yet/);
});

test("formats page recovery action resets search and category", () => {
  assert.match(source, /const resetFilters = \(\) => \{/);
  assert.match(source, /setQuery\(""\);/);
  assert.match(source, /setCategory\("Available"\);/);
  assert.match(source, /<button type="button" className="formats-reset-button" onClick=\{resetFilters\}>/);
  assert.match(source, /Show all formats/);
});

test("formats page keeps the populated results grid unchanged", () => {
  assert.match(source, /className=\{classNames\("format-card", !pair\.available && "is-disabled"\)\}/);
  assert.match(source, /className="format-card-meta"/);
  assert.match(source, /<ArrowRight size=\{14\} \/>/);
});
