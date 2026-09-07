import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("formats results render an empty state when no search/filter matches", () => {
  assert.match(source, /visiblePairs\.length === 0 \?/);
  assert.match(source, /formats-empty/);
  assert.match(source, /No formats found/);
  assert.match(source, /No conversion options match/);
});

test("empty state exposes a keyboard-accessible reset action", () => {
  assert.match(source, /const resetFormats = \(\) => \{/);
  assert.match(source, /setQuery\(""\)/);
  assert.match(source, /setCategory\("Available"\)/);
  assert.match(source, /className="formats-reset"/);
  assert.match(source, /<button type="button" className="formats-reset"/);
});

test("empty state announces itself to assistive tech", () => {
  assert.match(source, /role="status"/);
});

test("empty state is styled and spans the full results grid", () => {
  assert.match(styles, /\.formats-empty \{/);
  assert.match(styles, /grid-column: 1 \/ -1/);
  assert.match(styles, /\.formats-empty \.formats-reset:focus-visible/);
});
