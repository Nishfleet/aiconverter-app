import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin overview exposes preview funnel counts and safe issue rows", () => {
  const apiSource = readFileSync(new URL("../functions/api/admin/overview.js", import.meta.url), "utf8");
  const adminSource = readFileSync(new URL("../public/admin/admin.js", import.meta.url), "utf8");

  assert.match(apiSource, /FROM preview_funnel_events/);
  assert.match(apiSource, /previewFunnel/);
  assert.match(apiSource, /previewFunnelByRoute/);
  assert.match(apiSource, /previewFunnelIssues/);
  assert.match(apiSource, /previewErrors/);
  assert.match(apiSource, /turnstileFailures/);

  assert.match(adminSource, /renderFunnel/);
  assert.match(adminSource, /Preview funnel/);
  assert.match(adminSource, /Privacy-safe events only/i);
  assert.match(adminSource, /Preview funnel issues/);
});
