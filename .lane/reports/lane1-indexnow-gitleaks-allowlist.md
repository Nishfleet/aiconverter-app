# Lane evidence — aiconverter-app lane 1

## 2026-08-15 — IndexNow deliverable (PR #44) unblock: allowlist by-design-public keys in gitleaks config

**Packet item:** PR #44 (IndexNow deliverable for the Bing/DDG discovery gap) is blocked by Gitleaks flagging the by-design-public IndexNow key.

**Verdict: delivered.** PR #123 (`lane1/indexnow-gitleaks-allowlist`) adds a repo-root `.gitleaks.toml` that extends the default Gitleaks rules and allowlists the by-design-public IndexNow key values + public key-file paths, so the Secret Scan gate no longer flags the IndexNow deliverable.

### Investigation findings (live state)

- PR #44 (closed): added key file `public/e141d4be-...txt` + doc with the submission curl; Gitleaks check FAILED (`generic-api-key` at `ops/bing-indexation.md:87`).
- PR #62 (closed, unmerged): carried the same allowlist idea but on a branch with ~7k lines of unrelated deletions — not mergeable as-is.
- PR #99 (open, mergeable): current deliverable with key `1bc751e6-...`; its Gitleaks check passes because the current key value doesn't trip the rule in the PR-range scan — but main's ancestry still holds 3 real `generic-api-key` findings for the older key, and no allowlist exists on main.
- PR #61 (merged): fixed only the runner-side Secret Scan infra (no /tmp, no stale cache). The content-side allowlist was never merged.

### Verification (gitleaks 8.24.3 — exact CI binary)

| Scan | Result |
|---|---|
| `origin/main` ancestry, default config | 3 findings (`generic-api-key`, `ops/bing-indexation.md`) |
| Same + `.gitleaks.toml` | no leaks (exit 0) |
| CI-style range scan (`--no-merges --first-parent base..head`) + current key file | no leaks (exit 0) |
| `npm run check:pricing` | consistent |
| `node --test tests/*.test.mjs` | 196/196 pass |
| `npm run build` | green |

### Files

- `.gitleaks.toml` — repo-root config, `[extend] useDefault = true`, global `[allowlist]` covering both IndexNow key UUIDs and the public key-file paths.
- `.lane/reports/lane1-indexnow-gitleaks-allowlist.md` — this evidence record.

### PR

- https://github.com/nish3451/aiconverter-app/pull/123
