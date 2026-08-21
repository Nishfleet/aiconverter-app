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

test("monitor prints literal funnel=active / funnel=skipped line for grep", () => {
  // The Done when for this lane item requires the routine monitor output to
  // print a single-line `funnel=active` (with named counts) or
  // `funnel=skipped (admin token not configured)` indicator so operators can
  // grep one line without parsing the JSON dump. Lock in that both branches
  // exist and the skip path does not flip the green/red behavior on its own.
  assert.match(source, /funnel=active/);
  assert.match(source, /funnel=skipped \(admin token not configured\)/);
  assert.match(source, /console\.log\(funnelLine\)/);
});

test("monitor JSON output exposes funnelStatus and funnel summary at top level", () => {
  // The JSON dump must include a stable top-level funnelStatus
  // (`active` | `skipped`) so dashboards can chart funnel coverage, plus a
  // top-level `funnel` summary keyed by camelCase event types.
  assert.match(source, /funnelStatus/);
  assert.match(source, /adminToken \? "active" : "skipped"/);
  assert.match(source, /funnel: funnelSummary/);
});

test("skip path keeps the monitor green when run is otherwise OK", () => {
  // The funnel skip must not independently fail or warn the monitor. The
  // missing-admin entry that records the skip is pushed to warnings only when
  // AICONVERTER_MONITOR_PUBLIC_ONLY=true; otherwise it lands in failures only
  // because admin authentication is genuinely required for the strict mode,
  // not because funnel surfacing itself is broken.
  assert.match(source, /if \(publicOnly\) warnings\.push\(missingAdmin\)/);
  assert.match(source, /else failures\.push\(missingAdmin\)/);
  // funnelStatus and funnel fields are added above and below the original
  // warnings/failures shape — the green/red math is unchanged.
  assert.match(source, /const monitorOk = failures\.length === 0 && !\(strictWarnings && warnings\.length\)/);
});
