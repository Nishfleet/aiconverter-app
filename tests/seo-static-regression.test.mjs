import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function listIndexFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return listIndexFiles(path);
    return entry === "index.html" ? [path] : [];
  });
}

const pages = ["index.html", ...listIndexFiles("public").filter((file) => !file.includes("/admin/"))];

function visibleWordCount(html) {
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return visible ? visible.split(/\s+/).length : 0;
}

test("indexable pages satisfy the SEO audit basics", () => {
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/s)?.[1] || "";
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page} should have one H1`);
    assert.ok(visibleWordCount(html) >= 300, `${page} should have substantial crawler-visible copy`);
    assert.ok(description.length > 50 && description.length <= 160, `${page} should have a search-sized description`);
    assert.ok((html.match(/href="\//g) || []).length >= 3, `${page} should expose internal links`);
    assert.ok((html.match(/href="https?:\/\/(?!aiconverter\.app)/g) || []).length >= 1, `${page} should expose a relevant external reference`);
    assert.ok((html.match(/<img\b/g) || []).length >= 1, `${page} should include an image with alt text`);
    assert.match(html, /application\/ld\+json/, `${page} should include JSON-LD schema`);
    assert.match(html, /property="og:image"/, `${page} should include an Open Graph image`);
    assert.match(html, /name="twitter:image"/, `${page} should include a Twitter image`);
    assert.match(html, /rel="apple-touch-icon"/, `${page} should include Apple touch icon metadata`);
  }
});
