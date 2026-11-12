import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Cloudflare Pages routing does not soft-404 unknown paths", () => {
  const redirects = readFileSync("public/_redirects", "utf8");
  const middleware = readFileSync("functions/_middleware.js", "utf8");

  assert.doesNotMatch(redirects, /\/\*\s+\/index\.html\s+200/);
  assert.match(redirects, /404\.html/);
  assert.match(middleware, /status:\s*knownMarkdown\s*\?\s*200\s*:\s*404/);
});
