import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import Beasties from "beasties";

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? htmlFiles(join(dir, entry.name)) : entry.name.endsWith(".html") ? [join(dir, entry.name)] : []
    )
  );
  return nested.flat();
}

function inlineCriticalCss() {
  let outDir = "dist";
  return {
    name: "inline-critical-css",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const beasties = new Beasties({
        path: outDir,
        publicPath: "/",
        inlineThreshold: 20000,
        minimumExternalSize: 0,
        preload: "media",
        pruneSource: false,
        logLevel: "warn"
      });
      for (const file of await htmlFiles(outDir)) {
        const html = await readFile(file, "utf8");
        if (!html.includes('rel="stylesheet"')) continue;
        const processed = await beasties.process(html);
        await writeFile(file, processed.replaceAll(` onload="this.media='all'"`, ""));
      }
    }
  };
}

export default defineConfig({
  plugins: [tailwindcss(), inlineCriticalCss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
