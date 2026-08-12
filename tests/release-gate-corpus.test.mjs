import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS_SCRIPT = path.join(REPO_ROOT, "scripts", "private-corpus.mjs");

// Runs the corpus script exactly as npm would launch it (node script path),
// but in a throwaway directory so the release path is exercised without any
// real private corpus present.
async function runCorpus({ manifest, required }) {
  const dir = await mkdtemp(path.join(tmpdir(), "release-gate-corpus-"));
  try {
    const manifestPath = path.join(dir, "manifest.json");
    if (manifest !== null) await writeFile(manifestPath, JSON.stringify(manifest));
    const env = {
      ...process.env,
      AICONVERTER_PRIVATE_CORPUS_MANIFEST: manifestPath,
      ...(required ? { AICONVERTER_PRIVATE_CORPUS_REQUIRED: "true" } : {})
    };
    try {
      const { stdout } = await execFileAsync(process.execPath, [CORPUS_SCRIPT], { cwd: dir, env });
      return { exitCode: 0, stdout };
    } catch (error) {
      return { exitCode: error.code, stdout: String(error.stdout || "") };
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("release path (required=true) fails loud when the private corpus manifest is missing", async () => {
  const { exitCode, stdout } = await runCorpus({ manifest: null, required: true });
  assert.notEqual(exitCode, 0, "missing corpus must fail the release gate");
  assert.match(stdout, /No private corpus manifest found/);
});

test("release path (required=true) fails loud when the private corpus manifest is empty", async () => {
  const { exitCode, stdout } = await runCorpus({ manifest: { baseDir: ".", cases: [] }, required: true });
  assert.notEqual(exitCode, 0, "empty corpus must fail the release gate");
  assert.match(stdout, /has no cases/);
});

test("local developer runs keep the permissive skip when no corpus is present", async () => {
  const { exitCode, stdout } = await runCorpus({ manifest: null, required: false });
  assert.equal(exitCode, 0, "permissive local run must still exit 0");
  assert.match(stdout, /"ok": true/);
});

test("release:gate itself wires the strict corpus flag so callers cannot forget it", async () => {
  const packageJson = JSON.parse(
    await (await import("node:fs/promises")).readFile(path.join(REPO_ROOT, "package.json"), "utf8")
  );
  const releaseGate = String(packageJson.scripts?.["release:gate"] || "");
  assert.match(
    releaseGate,
    /AICONVERTER_PRIVATE_CORPUS_REQUIRED=true npm run corpus:private/,
    "release:gate must embed the strict flag on the release path"
  );
});
