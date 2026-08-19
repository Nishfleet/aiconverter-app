import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("file selection brings the workspace into view when it is off-screen", () => {
  assert.match(source, /function scrollWorkspaceIntoView\(\)/, "workspace scroll helper exists");
  assert.match(source, /document\.getElementById\("start"\)/, "helper targets the conversion workspace");
  assert.match(source, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/, "scroll is smooth and starts at the workspace top");
});

test("scroll helper is guarded so an already-visible workspace never jumps", () => {
  assert.match(source, /workspaceTopVisible/, "helper computes workspace visibility");
  assert.match(source, /rect\.top >= 0 && rect\.top < viewportHeight \* 0\.75/, "only scrolls when the workspace top is out of the viewport");
  assert.match(source, /if \(!workspaceTopVisible\)/, "no-op when the workspace is already visible");
});

test("handleFileChange calls the scroll helper after applying a new file", () => {
  assert.match(source, /event\.target\.value = "";\n    scrollWorkspaceIntoView\(\);/, "scroll runs after the file picker input is cleared");
});

test("pricing-card and security-section Upload file CTAs open the same file picker", () => {
  assert.match(source, /fileInputRef\.current\?\.click\(\)/, "CTAs trigger the file picker");
  const pricingCtaCount = (source.match(/fileInputRef\.current\?\.click\(\)/g) || []).length;
  assert.ok(pricingCtaCount >= 3, `expected at least 3 picker triggers (upload-another, pricing cards, security), got ${pricingCtaCount}`);
});
