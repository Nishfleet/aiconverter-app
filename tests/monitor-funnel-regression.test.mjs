import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./live/monitor-live.mjs", import.meta.url), "utf8");

test("routine monitor output surfaces live funnel visit counts from the admin overview", () => {
  assert.match(source, /previewFunnel/);
  assert.match(source, /Array\.isArray\(body\.previewFunnel\)/);
  assert.match(source, /funnel: summarizeFunnel\(previewFunnel\)/);
  assert.match(source, /previewFunnel,/);
});

test("funnel summary maps snake_case event types to named camelCase counts", () => {
  assert.match(source, /replace\(\/_\(\[a-z\]\)\/g/);
  assert.match(source, /summary\[eventType\] = Number\.isFinite\(count\) \? count : 0/);
});

test("monitor prints literal funnel=active / funnel=skipped line for grep", () => {
  assert.match(source, /funnel=active/);
  assert.match(source, /funnel=skipped \(admin token not configured\)/);
  assert.match(source, /console\.log\(funnelLine\)/);
});

test("monitor JSON output exposes funnelStatus and funnel summary at top level", () => {
  assert.match(source, /funnelStatus/);
  assert.match(source, /adminToken \? "active" : "skipped"/);
  assert.match(source, /funnel: funnelSummary/);
});

test("skip path keeps the monitor green when run is otherwise OK", () => {
  assert.match(source, /if \(publicOnly\) warnings\.push\(missingAdmin\)/);
  assert.match(source, /else failures\.push\(missingAdmin\)/);

  assert.match(source, /const monitorOk = failures\.length === 0 && !\(strictWarnings && warnings\.length\)/);
});
