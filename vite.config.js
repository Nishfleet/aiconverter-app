import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import Beasties from "beasties";
import { cloudflare } from "@cloudflare/vite-plugin";
import { buildSitemap } from "./src/cli/build-sitemap.mjs";

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? htmlFiles(join(dir, entry.name)) : entry.name.endsWith(".html") ? [join(dir, entry.name)] : []
    )
  );
  return nested.flat();
}

// The Cloudflare plugin builds the Worker and the static site as two Vite
// environments; these site plugins belong only in the assets build.
function isClient(environment) {
  return environment.name === "client";
}

function inlineCriticalCss() {
  let outDir = "dist";
  return {
    name: "inline-critical-css",
    apply: "build",
    applyToEnvironment: isClient,
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
      // The dated sitemap is written into the same dir the static assets land
      // in: the Cloudflare Build Output's assets folder, so one `vite build`
      // produces the whole deployable site.
      buildSitemap(join(outDir, "sitemap.xml"));
    }
  };
}

export default defineConfig({
  plugins: [cloudflare(), tailwindcss(), inlineCriticalCss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
