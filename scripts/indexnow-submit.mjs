// IndexNow submission for aiconverter.app (credential-free by protocol).
//
// The IndexNow protocol needs no account or API key: the key is a self-issued
// UUID that the site proves it owns by serving it at
// https://aiconverter.app/<key>.txt. This script refuses to run until that key
// file is actually live (a non-live key is rejected by the protocol and a
// submission would be wasted), then POSTs the given URLs to api.indexnow.org.
//
// Usage:
//   node scripts/indexnow-submit.mjs            # submit the sitemap's URLs
//   node scripts/indexnow-submit.mjs <url>...   # submit specific URLs
//
// The live key file check uses the same key that is committed by design at
// public/<key>.txt (allowlisted in .gitleaks.toml as public-by-protocol).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const key = (await readFile(path.join(root, "public/IndexNow.txt"), "utf8"))
    .trim();
  if (!/^[0-9a-fA-F-]{32,64}$/.test(key)) {
    throw new Error(`IndexNow key file public/IndexNow.txt does not hold a UUID (got "${key}")`);
  }

  const host = "aiconverter.app";
  const keyUrl = `https://${host}/${key}.txt`;
  const live = await fetch(keyUrl, { signal: AbortSignal.timeout(15000) });
  if (!live.ok) {
    throw new Error(
      `Refusing to submit: IndexNow key file is not live yet (${keyUrl} -> HTTP ${live.status}). ` +
        `The key goes live with the next Cloudflare Pages deploy (PR #135); re-run this script once the file returns 200.`
    );
  }
  const liveKey = (await live.text()).trim();
  if (liveKey !== key) {
    throw new Error(`Live key file ${keyUrl} holds "${liveKey}", not the committed key — aborting.`);
  }

  const urls =
    process.argv.length > 2
      ? process.argv.slice(2)
      : (await readFile(path.join(root, "public/sitemap.xml"), "utf8"))
          .match(/<loc>(https:\/\/aiconverter\.app\/[^<]*)<\/loc>/g)
          ?.map((m) => m.slice(5, -6)) ?? [];
  if (urls.length === 0) {
    throw new Error("No URLs to submit (pass URLs as arguments or ensure public/sitemap.xml has entries)");
  }

  const body = { host, key, keyLocation: keyUrl, urlList: urls };
  console.log(`Submitting ${urls.length} URL(s) to https://api.indexnow.org/ ...`);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow accepted (HTTP ${res.status}) for ${urls.length} URL(s).`);
  } else if (res.status === 403) {
    throw new Error(`IndexNow rejected the key (HTTP 403) — key file live but not matching? Check ${keyUrl}`);
  } else {
    const text = await res.text().catch(() => "");
    throw new Error(`IndexNow returned HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
}

main().catch((err) => {
  console.error(`indexnow-submit: ${err.message}`);
  process.exit(1);
});
