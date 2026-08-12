import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = path.join(REPO_ROOT, "migrations");

// Baseline of ordinals that legitimately appear more than once in the
// migration directory. As of 2026-08-12 the tree has two distinct files both
// numbered 0008:
//   - 0008_accounting_exports.sql
//   - 0008_admin_monitoring_indexes.sql
// They cannot be renumbered safely without first confirming the live D1
// `d1_migrations` state (wrangler tracks applied migrations by filename; a
// renamed, already-applied migration would be re-run, and
// 0008_accounting_exports.sql contains non-idempotent ADD COLUMN statements).
// Until that live check is possible, this allowlist documents the known pair
// and the test below fails the suite the moment any NEW duplicate ordinal (or
// a third 0008 file) appears. Once the pair is properly renumbered, delete
// this entry and the test enforces strict uniqueness.
const KNOWN_DUPLICATE_ORDINALS = new Map([["0008", 2]]);

test("migration files follow the NNNN_name.sql naming convention", async () => {
  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql"));
  assert.ok(files.length > 0, "migrations directory must not be empty");
  for (const name of files) {
    assert.match(name, /^\d{4}_[a-z0-9_]+\.sql$/, `unexpected migration filename: ${name}`);
  }
});

test("no migration ordinal appears more often than its allowlisted baseline (duplicate-ordinal guard)", async () => {
  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql"));
  const counts = new Map();
  for (const name of files) {
    const ordinal = name.slice(0, 4);
    counts.set(ordinal, (counts.get(ordinal) || 0) + 1);
  }

  const violations = [];
  for (const [ordinal, count] of counts) {
    const allowed = KNOWN_DUPLICATE_ORDINALS.get(ordinal) ?? 1;
    if (count > allowed) {
      violations.push(
        `ordinal ${ordinal} appears ${count} times (allowlisted baseline: ${allowed})`
      );
    }
  }

  assert.deepEqual(
    violations,
    [],
    [
      "duplicate migration ordinals have undefined human-facing numbering and make",
      "renumbering an already-applied migration a data-integrity hazard.",
      `Known pair (do not extend unless justified in the allowlist): ${JSON.stringify([...KNOWN_DUPLICATE_ORDINALS])}`,
      ...violations
    ].join(" ")
  );
});

test("known duplicate-ordinal pair has deterministic apply order (string tiebreak)", async () => {
  // wrangler 4.121.0 compares migration names by leading number first and
  // falls back to full-path string comparison for equal numbers, so this pair
  // applies in a fixed, reproducible order.
  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql"));
  const eightFiles = files.filter((name) => name.startsWith("0008_")).sort();
  assert.deepEqual(eightFiles, ["0008_accounting_exports.sql", "0008_admin_monitoring_indexes.sql"]);
});

test("non-idempotent migration files are listed exactly once each (no accidental re-run copies)", async () => {
  // ADD COLUMN / CREATE TABLE statements fail when re-run; the migration
  // directory must never contain two different files that would re-execute
  // the same DDL (rename of an applied migration has exactly this effect).
  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql"));
  const fullBodies = new Map();
  for (const name of files) {
    const body = (await readFile(path.join(MIGRATIONS_DIR, name), "utf8")).replace(/\s+/g, " ").trim();
    fullBodies.set(body, (fullBodies.get(body) || 0) + 1);
  }
  const duplicates = [...fullBodies.entries()].filter(([, count]) => count > 1);
  assert.deepEqual(duplicates, [], "two migration files must never contain identical DDL");
});
