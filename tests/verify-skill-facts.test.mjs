import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const SKILL_DIR = new URL("../.claude/skills/verify/", import.meta.url);

function skillMarkdownFiles() {
  const names = ["SKILL.md", ...readdirSync(new URL("features/", SKILL_DIR)).map((name) => `features/${name}`)];
  return names.filter((name) => name.endsWith(".md"));
}

test("every playwright version quoted in the verify skill is the pin in package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const pin = pkg.devDependencies.playwright;
  assert.ok(pin, "package.json must pin playwright");
  let quotes = 0;
  for (const name of skillMarkdownFiles()) {
    const text = readFileSync(new URL(name, SKILL_DIR), "utf8");
    for (const [, version] of text.matchAll(/(?:pinned to|pin is) `(\d+\.\d+\.\d+)`/g)) {
      assert.equal(version, pin, `${name} quotes playwright ${version}, but package.json pins ${pin}`);
      quotes += 1;
    }
  }
  assert.ok(quotes >= 2, `expected SKILL.md to quote the playwright pin, found ${quotes} quotes`);
});

test("the sitemap entry count quoted in the verify skill is the url count in public/sitemap.xml", () => {
  const skill = readFileSync(new URL("SKILL.md", SKILL_DIR), "utf8");
  const quoted = skill.match(/(\d+) sitemap entries/);
  assert.ok(quoted, "SKILL.md must quote the sitemap entry count");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const urls = sitemap.match(/<url>/g)?.length ?? 0;
  assert.equal(
    Number(quoted[1]),
    urls,
    `SKILL.md quotes ${quoted[1]} sitemap entries, but public/sitemap.xml has ${urls}`
  );
});
