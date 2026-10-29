import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = readFileSync(
  path.join(REPO_ROOT, ".github", "workflows", "d1-export.yml"),
  "utf8"
);
const DRILL = readFileSync(path.join(REPO_ROOT, "docs", "ops", "database.md"), "utf8");
const VERSION = WORKFLOW.match(/npx --yes wrangler@(\d+\.\d+\.\d+) d1 export/)?.[1];

const PINNED_RECIPIENT =
  "age1650j6pxe55udk93gv3qsjeugfrdkhazc3ynpydjm64qm8k7fvvjqc093e4";

test("the age recipient is the pinned backup key, so a swap is a reviewed diff", () => {
  const recipient = WORKFLOW.match(/^\s+AGE_RECIPIENT: (\S+)$/m)?.[1];
  assert.ok(recipient, "d1-export.yml declares no AGE_RECIPIENT");
  assert.equal(
    recipient,
    PINNED_RECIPIENT,
    "AGE_RECIPIENT changed: update PINNED_RECIPIENT in tests/d1-export.test.mjs in the same change, or future dumps seal to a key the restore drill cannot open"
  );
  assert.match(recipient, /^age1[0-9a-z]{58}$/, "the recipient is not an age public key");
});

test("the pinned recipient is the fleet host key's public half where that host holds it", (t) => {
  const keyFile = path.join(homedir(), ".config", "drive", "d1-backup-key.txt");
  if (!existsSync(keyFile)) return t.skip("this host holds no backup key file");
  const publicHalf = readFileSync(keyFile, "utf8").match(/age1[0-9a-z]{58}/)?.[0];
  assert.ok(publicHalf, "the backup key file carries no public key");
  assert.equal(
    publicHalf,
    PINNED_RECIPIENT,
    "the workflow seals dumps to a key that is not the fleet host's backup key"
  );
});

test("the dump is the stock wrangler export, pinned to the release the drill runs", () => {
  assert.match(WORKFLOW, /npx --yes wrangler@\d+\.\d+\.\d+ d1 export aiconverter --remote/);
  assert.ok(VERSION, "the wrangler version is not pinned to an exact release");
  assert.match(
    DRILL,
    new RegExp(`wrangler@${VERSION.replace(/\./g, "\\.")} `),
    "the workflow and the restore drill must pin the same wrangler release, so one bump is one reviewed diff"
  );
});

test("no hand-rolled export survives: the poller, the header file and the inline fetch are gone", () => {
  for (const piece of ["at_bookmark", "seq 1 ", "Authorization: Bearer", "node -e", "sleep "]) {
    assert.ok(!WORKFLOW.includes(piece), `d1-export.yml must not hand-roll the export; found "${piece}"`);
  }
  assert.ok(!WORKFLOW.includes("strategy:"), "one database needs no matrix layer");
  assert.ok(
    /> "\$RUNNER_TEMP\/d1-export\.log" 2>&1/.test(WORKFLOW),
    "wrangler's output, which carries the dump's one-hour signed download URL, must stay out of this public log"
  );
});

test("the workflow names no internal id and takes the account id from the repo secret", () => {
  assert.match(WORKFLOW, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.ok(
    !WORKFLOW.includes("376080eb"),
    "the D1 database id belongs in wrangler.jsonc, not in a public workflow"
  );
  assert.ok(
    !/CLOUDFLARE_ACCOUNT_ID: [0-9a-f]{32}/.test(WORKFLOW),
    "the Cloudflare account id belongs in the repo secret, not in a public workflow"
  );
});

test("only the sealed ciphertext uploads, and an empty dump refuses to ship", () => {
  const upload = WORKFLOW.slice(WORKFLOW.indexOf("upload-artifact"));
  assert.ok(upload, "the upload step is missing");
  assert.match(upload, /name: d1-backup-aiconverter/);
  assert.match(upload, /path: \$\{\{ runner\.temp \}\}\/d1-export\/\*\.sql\.age/);
  assert.match(upload, /if-no-files-found: error/);
  const plainGone = WORKFLOW.indexOf('rm -f "$dump"');
  assert.ok(plainGone >= 0 && plainGone < WORKFLOW.indexOf("upload-artifact"),
    "the plaintext must be deleted before the upload step runs");
  assert.match(WORKFLOW, /test -s "\$dump"/);
});

test("the workflow carries no em-dash, which the repo style forbids", () => {
  assert.ok(!WORKFLOW.includes("—"), "replace em-dashes with commas or colons");
});
