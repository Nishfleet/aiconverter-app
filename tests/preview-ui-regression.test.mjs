import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const integrationGates = readFileSync(new URL("../ops/integration-gates.md", import.meta.url), "utf8");

test("preview button exposes every customer-facing block reason", () => {
  assert.match(source, /const previewBlockReason = !file/);
  assert.match(source, /This file is over the \$\{selectedMaxSizeMb\} MB limit/);
  assert.match(source, /Loading secure upload checks/);
  assert.match(source, /Secure upload settings could not load/);
  assert.match(source, /Complete the human check to generate your preview/);
  assert.match(source, /Human check expired/);
  assert.match(source, /Human check failed to load/);
  assert.match(source, /preview-blocker-note/);
  assert.match(source, /Retry human check/);
});

test("preview funnel hooks cover file, output, click, success, and error", () => {
  assert.match(source, /trackFunnelEvent\(eventType/);
  assert.match(source, /trackPreviewEvent\("file_selected"/);
  assert.match(source, /trackPreviewEvent\("output_selected"/);
  assert.match(source, /trackPreviewEvent\("preview_click"/);
  assert.match(source, /trackPreviewEvent\("preview_success"/);
  assert.match(source, /trackPreviewEvent\("preview_error"/);
  assert.match(source, /form\.append\("funnelSessionId", funnelSessionIdRef\.current\)/);
});

test("homepage leads with bank statements and no-upload sample proof", () => {
  assert.match(source, /Bank statement PDFs in\./);
  assert.match(source, /Reviewable exports out\./);
  assert.match(source, /See sample output/);
  assert.match(source, /Fictional bank statement sample output/);
  assert.match(source, /Download sample CSV/);
  assert.match(source, /Loading live unlock pricing/);
  assert.match(source, /Live pricing is unavailable, so checkout is paused/);
  assert.doesNotMatch(source, /conversion-ticker/);
});

test("homepage uses static bank route chips and truthful integration boundaries", () => {
  assert.match(source, /BANK_ROUTE_CHIPS/);
  assert.match(source, /Google Sheets CSV/);
  assert.match(source, /CSV prep is live now\. Direct app connections are not live\./);
  assert.match(source, /official QuickBooks\/Xero connection/);
  assert.match(source, /not reconciliation, categorization, tax advice/);
});

test("review workspace and bookkeeper batch labels are exposed", () => {
  assert.match(source, /Validation before import/);
  assert.match(source, /Full range is included in the validation report/);
  assert.match(source, /Bookkeeper labels/);
  assert.match(source, /clientLabel/);
  assert.match(source, /periodLabel/);
  assert.match(source, /accountLabel/);
  assert.match(source, /Optional ZIP folders/);
});

test("direct integrations stay gated in repo documentation", () => {
  assert.match(integrationGates, /Direct app connections are not live/);
  assert.match(integrationGates, /Google Sheets sync/);
  assert.match(integrationGates, /OAuth scopes are minimal and documented/);
  assert.match(integrationGates, /Public copy separates file prep from direct integration/);
});
