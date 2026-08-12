import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../scripts/monitor-live.mjs", import.meta.url), "utf8");

test("routine monitor output surfaces live funnel visit counts from the admin overview", () => {
  // The admin API already returns per-event 24h funnel counts (previewFunnel,
  // including page_view); the monitor must not drop them from its output.
  assert.match(source, /previewFunnel/);
  assert.match(source, /Array\.isArray\(body\.previewFunnel\)/);
  assert.match(source, /funnel: summarizeFunnel\(previewFunnel\)/);
  assert.match(source, /previewFunnel,/);
});

test("funnel summary maps snake_case event types to named camelCase counts", () => {
  // Lock in the derived summary shape: pageView plus downstream funnel stages,
  // each as a named count in the monitor output.
  assert.match(source, /page_view/);
  assert.match(source, /replace\(\/_\(\[a-z\]\)\/g/);
  assert.match(source, /summary\[eventType\] = Number\.isFinite\(count\) \? count : 0/);
});
