# Lane evidence — aiconverter-app lane 1 — retire IndexNow/Gitleaks item e7a8c5a727 (2026-08-23)

**Packet item:** e7a8c5a727 — PR #44 (IndexNow deliverable for the Bing/DDG discovery gap) is blocked by Gitleaks flagging the by-design-public IndexNow key.

**Verdict: already resolved on origin/main.** The credential-free IndexNow path is live and Gitleaks-clean. No product-code PR opened; this branch records the evidence and retires the item.

**Resolution lineage on origin/main:**
- PR #123 — `chore: allowlist by-design-public IndexNow keys in gitleaks config` (commit `ba03726`).
- PR #156 — `growth: add credential-free IndexNow submission script` (merge `92d2670`).
- PR #162 — `docs(lane): submit IndexNow now that the key is live (2026-08-22)` (merge `0328713`).

**Current `origin/main` SHA at verification:** `851a22345ad2889d328babfc45dedbf3a3ab65b3`
**Branch:** `lane1-indexnow-retire-e7a8c5a727-20260823`

## Live checks (run from this checkout)

- `git rev-parse origin/main` → `851a22345ad2889d328babfc45dedbf3a3ab65b3`
- `git ls-tree -r origin/main -- .gitleaks.toml public/IndexNow.txt public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt scripts/indexnow-submit.mjs` → all four blobs present.
- `curl -s -o /dev/null -w '%{http_code}' https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt` → `200`
- `curl -s -o /dev/null -w '%{http_code}' https://aiconverter.app/IndexNow.txt` → `200`
- `curl -s https://aiconverter.app/IndexNow.txt` → `1bc751e6-ead3-48da-96d3-722f77cc4464`
- `gitleaks detect --source . --config .gitleaks.toml --no-banner --log-level=error` → exit `0`, no findings.
- `node scripts/indexnow-submit.mjs` → exit 0 — stdout:
  ~~~
  Submitting 25 URL(s) to https://api.indexnow.org/ ...
  IndexNow accepted (HTTP 200) for 25 URL(s).
  ~~~

## Files in this branch

- `.lane/reports/lane1-indexnow-retire-e7a8c5a727-20260823.md` — this evidence record.

## Out of scope / Nish-held

- Bing Webmaster Tools ownership verification and `site:` SERP hits remain Nish-reserved and are not part of this item.
