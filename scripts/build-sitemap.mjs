#!/usr/bin/env node
// Builds public/sitemap.xml with <lastmod> dates derived from git history.
// For each URL, the lastmod is the date of the last git commit that touched
// the corresponding source file. Run before `vite build` or manually.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SITEMAP_PATH = "public/sitemap.xml";
const BASE = "https://aiconverter.app";

function gitLastMod(filePath) {
  try {
    const iso = execSync(`git log -1 --format=%ai -- "${filePath}"`, { encoding: "utf8" }).trim();
    return iso ? iso.slice(0, 10) : null;
  } catch {
    return null;
  }
}

function resolveSourceFile(path) {
  if (path === "/") return "src/main.jsx";
  if (path === "/llms.txt" || path === "/llms-full.txt" || path === "/sample-bank-statement.csv") {
    return `public${path}`;
  }
  return `public${path}index.html`;
}

function buildSitemap() {
  const existing = readFileSync(SITEMAP_PATH, "utf8");
  const urls = [...existing.matchAll(/<loc>(https:\/\/aiconverter\.app[^<]*)<\/loc>/g)].map((m) => m[1]);

  const entries = urls.map((url) => {
    const path = url.replace(BASE, "");
    const source = resolveSourceFile(path);
    const lastmod = gitLastMod(source);
    if (!lastmod) {
      throw new Error(`No git history for ${source} (URL: ${url})`);
    }
    return `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  writeFileSync(SITEMAP_PATH, xml);
  console.log(`sitemap.xml rebuilt with ${entries.length} entries (lastmod from git history)`);
}

buildSitemap();
