import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("formats page renders a zero-result state instead of an empty grid", () => {
  assert.match(source, /visiblePairs\.length \?/);
  assert.match(source, /formats-empty/);
  assert.match(source, /role="status"/);
  assert.match(source, /No formats match/);
  assert.match(source, /No \$\{category\} formats yet/);
  assert.match(source, /Clear search and category/);
  assert.match(source, /setQuery\(""\)/);
  assert.match(source, /setCategory\("Available"\)/);
});

test("zero-result state keeps populated results rendering unchanged", () => {
  assert.match(source, /visiblePairs\.map\(\(pair\) =>/);
  assert.match(source, /format-card"/);
  assert.match(source, /pair\.input/);
  assert.match(source, /pair\.output/);
});

test("zero-result state styles span the grid and work in narrow layouts", () => {
  assert.match(styles, /\.formats-empty \{/);
  assert.match(styles, /grid-column: 1 \/ -1/);
  assert.match(styles, /\.formats-empty-icon/);
  assert.match(styles, /\.formats-empty-reset/);
});
