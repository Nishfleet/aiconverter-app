---
name: verify-aiconverter
description: Launch, health-check, drive, and prove the AI Converter app (`aiconverter.app`) locally and against the live site. Use before claiming any change to the converter, pricing, formats, or policy pages works end-to-end.
---

AI Converter (repo `aiconverter-app`) is a Cloudflare Pages app for preview-first
file conversion. The repo is a Vite + React 19 SPA in `src/`, with Cloudflare
Pages Functions in `functions/` and the D1 / R2 / Workers AI bindings declared
in `wrangler.jsonc`. Node 22 is in `.node-version`. The live site
(`aiconverter.app`) is the production-runtime the harness drives; a local
Vite dev/preview server is the deterministic SPA harness the docs use for
non-API pages. The Cloudflare Pages Functions runtime cannot be reproduced
locally (Workers AI is remote-only, and `wrangler pages dev` requires a
Cloudflare API token even with `--local`), so any drive that touches `/api/*`
must run against the live site.

Agents doing E2E verification MUST use this harness instead of improvising
a launch. Whoever ships a feature updates the matching file in `features/`
in the same PR.

## LAUNCH

### Primary — local Vite preview of the production build (deterministic)

```bash
npm ci
npm run build
npx vite preview --host 127.0.0.1 --port 4180 --strictPort
```

`npm run build` runs `scripts/build-sitemap.mjs` (rebuilds `dist/sitemap.xml`
from the git history, 25 entries) followed by `vite build`, which emits
`dist/index.html`, the hashed `dist/assets/index-*.js` and `index-*.css`,
and the pre-rendered marketing pages under `dist/<route>/index.html`
(23 routes, including `/`, `/about/`, `/formats/`, `/pricing/`,
`/privacy/`, `/terms/`, `/refund/`, `/security/`, `/trust/`,
`/data-retention/`, `/support/`, plus the long-tail bank-statement,
receipt, screenshot, and invoice SEO pages).

- Base URL: `http://127.0.0.1:4180`. Loopback only.
- Readiness: `curl -fsS http://127.0.0.1:4180/` returns HTTP 200 and the body
  contains the brand name `AI Converter` and the entry script tag
  `<script type="module" src="/assets/index-…js">`. Allow up to 30 s for the
  first request after a clean build.
- Launch it in the background with stdout+stderr captured, and record the PID.

```bash
mkdir -p /tmp/verify-aiconverter
npx vite preview --host 127.0.0.1 --port 4180 --strictPort \
  > /tmp/verify-aiconverter/server.log 2>&1 &
echo $! > /tmp/verify-aiconverter/server.pid
```

### Secondary — local Vite dev (HMR for source-level work)

```bash
npx vite --host 127.0.0.1 --port 4180 --strictPort
```

Default Vite dev server, port 4180, HMR enabled. Same readiness check.
Use this for source-level React work (e.g. iterating on
`src/main.jsx` or the SEO fallbacks in `index.html`); the production build
is the authoritative shape, so re-run the primary launch before claiming
E2E proof.

### Tertiary — live production site (the only way to drive `/api/*`)

```bash
curl -fsS -m 30 https://aiconverter.app/
```

The Cloudflare Pages Functions runtime (`functions/api/*.js`) only runs in
the production environment. `wrangler pages dev` will not start in this
repo without `CLOUDFLARE_API_TOKEN` because `wrangler.jsonc` declares the
Workers AI binding as `remote`, and `--local` does not currently disable
that proxy. Treat the live site as the "real-provider dev" analog:

- The `www.aiconverter.app` host returns 301 to the apex.
- `/api/health` returns the live capability snapshot — D1 ready, Dodo
  configured, Workers AI bound, Mistral / CloudConvert / Convertio
  configured when the matching secrets are set.
- `/api/config` returns the public Turnstile site key, Dodo mode, and the
  CloudConvert / Convertio / universalProvider capability flags.
- `/api/pricing-preview` returns the Dodo adaptive-currency pricing for
  the caller's country.

This harness does NOT recommend driving the live upload, paid-unlock, or
admin endpoints — those are paid-path and abuse-protected surfaces. Stay on
the read-only and configuration endpoints listed in `features/`.

### Never

- `npm run preview` (no such script in this repo) — the only preview
  command is `npx vite preview` from the Vite CLI.
- `wrangler pages dev` without a real `CLOUDFLARE_API_TOKEN` — the AI
  binding forces a remote-proxy session that will not start locally.
- Driving `/api/convert`, `/api/checkout`, `/api/finalize`, `/api/webhooks/*`
  from the harness — those are paid-path or abuse-protected surfaces;
  their unit-test coverage lives in `tests/*.test.mjs`, not the harness.
- `kill -9` on the Vite preview by matching the command line — match the
  recorded PID and SIGTERM the process group (see CLEANUP).

## DOCTOR

### Local SPA

`curl -fsS http://127.0.0.1:4180/` → HTTP 200 with the production-built
HTML. The body must contain the brand name (`AI Converter`), the canonical
href to `https://aiconverter.app/`, and the entry script tag pointing at a
file in `dist/assets/`.

```bash
curl -fsS http://127.0.0.1:4180/ -o /tmp/verify-aiconverter/home.html
grep -c 'AI Converter' /tmp/verify-aiconverter/home.html
grep -Eo 'src="/assets/index-[A-Za-z0-9_-]+\.js"' /tmp/verify-aiconverter/home.html
```

The pre-rendered marketing pages under `dist/<route>/index.html` are
served by Vite preview with HTTP 200; verify one to prove the build
emitted the page you shipped, not just the SPA shell:

```bash
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4180/formats/
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4180/pricing/
```

### Live API

`GET https://aiconverter.app/api/health` returns 200 with
`ok: true, status: "ready", missing: []` when every binding is
configured. The local server cannot reproduce this; assert the live
readiness before treating the harness run as green.

```bash
curl -fsS -m 30 https://aiconverter.app/api/health \
  | tee /tmp/verify-aiconverter/health.json \
  | grep -E '"ok":true|"status":"ready"|"missing":\[\]'
```

`GET https://aiconverter.app/api/config` returns 200 with
`turnstileSiteKey`, `payments.provider: "dodo"`, and the
`capabilities.universalProvider` flag. Public, safe to call from any IP.

`GET https://aiconverter.app/api/pricing-preview` returns 200 with
`available: true` and a `prices` map keyed by `starter`, `batch`, `pro`
(the repo's three plan IDs — see `src/data/converters.json`).

## DRIVE

Per-feature steps live in `features/`:

| Feature | File |
| --- | --- |
| Landing page `/` | `features/landing-page.md` |
| Formats page `/formats/` | `features/formats-page.md` |
| Pricing page `/pricing/` | `features/pricing-page.md` |
| Bank-statement and other SEO landing pages | `features/bank-statement-seo-pages.md` |
| Policy pages (`/privacy/`, `/terms/`, `/refund/`, `/security/`, `/trust/`, `/data-retention/`, `/about/`, `/support/`) | `features/policy-pages.md` |
| Live `/api/health` | `features/api-health.md` |
| Live `/api/config` | `features/api-config.md` |
| Live `/api/pricing-preview` | `features/api-pricing-preview.md` |
| Conversion workspace (the SPA on `/` after file selection) | `features/conversion-workspace.md` |

### Two drive styles

- **HTTP drive** — `curl` against the local Vite preview, or against
  `https://aiconverter.app` for the public read-only `/api/*` endpoints.
  Enough for SPA HTML / SEO / config-shape proof.
- **Browser drive** — Playwright (`playwright` is in `devDependencies`,
  pinned to `1.62.1`), or an interactive browser tool. Required for
  anything about clicking, the Turnstile widget, the file-upload drop
  zone, or the live preview table.

### Local honesty note

`functions/api/*` do NOT run in the local Vite preview. Any feature that
needs D1, R2, Dodo, Turnstile, Workers AI, Mistral OCR, CloudConvert, or
Convertio can only be driven against the live site, and only on the
public, read-only, rate-limited endpoints listed in `features/`. The
paid-path, admin, and abuse-protected surfaces have unit tests in
`tests/*.test.mjs`; the harness deliberately does not double as a paid
or admin probe.

## EVIDENCE

**Server log.** Vite preview logs request lines to stdout/stderr. The
captured launch log is the harness's log evidence. Tail it to confirm
the routes you drove actually hit the server:

```bash
tail -n 50 /tmp/verify-aiconverter/server.log
```

**HTML proof.** Save the fetched SSR / pre-rendered HTML for every drive:

```bash
curl -fsS http://127.0.0.1:4180/ -o /tmp/verify-aiconverter/home.html
curl -fsS http://127.0.0.1:4180/formats/ -o /tmp/verify-aiconverter/formats.html
curl -fsS http://127.0.0.1:4180/pricing/ -o /tmp/verify-aiconverter/pricing.html
```

**API proof.** The live `/api/health` JSON, written to
`/tmp/verify-aiconverter/health.json`, is the readiness proof. The
`/api/config` and `/api/pricing-preview` JSONs are the public-API proof.

**Screenshots** (browser drives): the workspace after file selection, the
preview table, the formats page search, and the pricing toggle. Use
Playwright (this repo's `playwright` pin is `1.62.1`); artifacts land in
`test-results/` (gitignored) or the run directory.

**What counts as proof:** local `curl /` returns 200 + brand + entry
script, every drove marketing page returns 200, the pre-rendered HTML
contains the route's expected text, and live `/api/health` shows
`ok: true, missing: []`. A claim in a transcript is not proof.

Store evidence OUTSIDE the repo tree — under `/tmp/verify-aiconverter/` or
the caller's evidence directory. Never commit evidence into this repo.

## CLEANUP

Kill the Vite preview by the recorded PID. Vite is single-process for the
preview command, so SIGTERM to the PID is enough; do not `pkill` by
matching command text (a 2026-08-26 fleet-wipe incident substring-matched
`vite` and killed every other agent's Vite server).

```bash
kill "$(cat /tmp/verify-aiconverter/server.pid)" 2>/dev/null
lsof -i :4180   # must print nothing
```

- `dist/` is the build output. `npm run build` regenerates it on every
  run; cleanup may delete `dist/` or leave it in place.
- `node_modules/`, `.vite/`, and `.wrangler/` are dev artifacts; leave
  them untouched unless the harness is the only thing touching this
  checkout.
- Do NOT run `npm run typecheck`, `npm audit`, `wrangler pages deploy`,
  or any script that mutates the worktree state as part of cleanup.
- Cleanup preserves evidence. Teardown never deletes the captured log,
  the HTML files, the `/api/health` JSON, or the screenshots.

## Source pattern

Adopted from `github.com/cursor/plugins` `pstack create-verification-skill`,
adapted for a Cloudflare Pages SPA where the Functions runtime is remote.
See `global-standing-rules.md` (`Per-repo verification harness`, 2026-08-20)
in `~/workspaces/tooling/nish-vault/_system/shared-memory/` for the rule
text and the pstack deep-read notes.
