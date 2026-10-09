import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Nish asked to adopt shadcn's DESIGN.md skill (2026-10-09). The skill reads
// the YAML frontmatter of DESIGN.md (colors, typography, rounded) and writes
// theme CSS from it, while the app reads the @theme and :root blocks of
// src/styles.css. Two sources for one set of tokens drift silently, so this
// test fails when a mapped token differs in either file, or exists in one and
// not the other. Dark-mode values, ease, duration and the shadcn role aliases
// have no schema key and are not mapped; the PR that added this test lists them.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal YAML subset reader: nested string-keyed maps, quoted strings and
// bare numbers. The frontmatter only ever uses those, and this keeps the repo
// free of a YAML dependency it does not otherwise need.
function parseYamlSubset(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const raw of text.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    const colon = line.indexOf(":");
    if (colon < 0) throw new Error(`frontmatter line has no key: ${line}`);
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (rest === "") {
      const child = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else {
      parent[key] = parseScalar(rest);
    }
  }
  return root;
}

function parseScalar(raw) {
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1).replace(/''/g, "'");
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1).replace(/\\"/g, '"');
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function frontmatter() {
  const source = readFileSync(path.join(ROOT, "DESIGN.md"), "utf8");
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match?.[1]) throw new Error("DESIGN.md has no YAML frontmatter");
  return parseYamlSubset(match[1]);
}

function declarations(css, opener) {
  const start = css.indexOf(`\n${opener} {\n`);
  if (start < 0) throw new Error(`src/styles.css has no ${opener} block`);
  const end = css.indexOf("\n}\n", start);
  const body = css.slice(start, end);
  return new Map([...body.matchAll(/^\s*(--[\w-]+):\s*(.+?);/gm)].map((m) => [m[1] ?? "", m[2] ?? ""]));
}

const css = readFileSync(path.join(ROOT, "src", "styles.css"), "utf8");
const theme = declarations(css, "@theme");
const light = declarations(css, ":root");
const design = frontmatter();

const RAW_COLORS = [...theme.keys()]
  .filter((key) => key.startsWith("--color-") && theme.get(key) === `var(--${key.slice(8)})`)
  .map((key) => key.slice(8))
  .filter((name) => light.has(`--${name}`));
const SCALE = [...theme.keys()].filter((key) => /^--text-[\w-]+$/.test(key) && !key.includes("--", 2));
const RADII = [...theme.keys()].filter((key) => key.startsWith("--radius-"));
const FAMILIES = ["--font-display", "--font-sans", "--font-mono"].map((key) => theme.get(key));

test("DESIGN.md frontmatter matches the src/styles.css tokens", async (t) => {
  await t.test("maps every palette colour to the light value in :root and the @theme alias", () => {
    assert.deepEqual(Object.keys(design.colors).sort(), [...RAW_COLORS].sort());
    for (const [name, value] of Object.entries(design.colors)) {
      assert.equal(value, light.get(`--${name}`), `colors.${name}`);
      assert.equal(theme.get(`--color-${name}`), `var(--${name})`, `--color-${name}`);
    }
  });

  await t.test("maps every type-scale token to its size, line height and tracking", () => {
    assert.deepEqual(Object.keys(design.typography).sort(), SCALE.map((key) => key.slice(7)).sort());
    for (const [name, token] of Object.entries(design.typography)) {
      assert.equal(token.fontSize, theme.get(`--text-${name}`), `${name} size`);
      assert.equal(String(token.lineHeight), theme.get(`--text-${name}--line-height`), `${name} line height`);
      assert.equal(token.letterSpacing, theme.get(`--text-${name}--letter-spacing`), `${name} tracking`);
      assert.ok(FAMILIES.includes(token.fontFamily), `${name} family`);
    }
  });

  await t.test("maps every radius step", () => {
    assert.deepEqual(Object.keys(design.rounded).sort(), RADII.map((key) => key.slice(9)).sort());
    for (const [name, value] of Object.entries(design.rounded)) {
      assert.equal(value, theme.get(`--radius-${name}`), `rounded.${name}`);
    }
  });
});
