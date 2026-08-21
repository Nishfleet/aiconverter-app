# Lane report: Pricing navigation route → truthful live pricing surface (2026-08-20)

Lane: aiconverter-app lane 1
Run date: 2026-08-20
Packet item: e3e7be0889 — "Make the Pricing navigation route resolve to a truthful live pricing surface [research-desk 2026-08-07, risk: ambe..."

## Outcome

**Code SHIPPED on `main`, but NOT LIVE in production — this lane re-verified live behavior and found the route 404s.**

The 2026-08-14 lane report (`.lane/reports/lane1-pricing-route-truthful-20260814.md`) recorded the
item as done because the code fix merged (PR #97, `df944db`). It is still merged and still green in
the worktree. But the production surface this item is about — a *live* `/pricing/` page — is 404
today, because **`main` never deploys to Cloudflare Pages**. The deploy lane (PR #135,
`lane1/deploy-workflow-20260820`) is ready and green, but is blocked on two repo secrets that only
Nish can provision. This lane cannot make the route live from the VPS: no Cloudflare API token or
account id exists in this environment, and the deploy is deliberately fail-closed.

## Live verification (2026-08-20, from this worktree)

- `curl -sL https://aiconverter.app/pricing/` → **HTTP 404** (Cloudflare 404 page, "Page not found").
- `curl -s https://aiconverter.app/` → HTTP 200 (so the site is up; production is simply behind main).
- `curl -s https://aiconverter.app/pricing` → HTTP 404 (same).
- `git fetch origin main`; `df944db` and `62f4f8d` are both ancestors of `origin/main` (fix is merged).
- `node --test tests/pricing-page-regression.test.mjs` → 8/8 pass.
- `npm run check:pricing` → "Pricing is consistent."
- `npm run build` → succeeds; `dist/pricing/index.html` (11,504 B) and `dist/pricing/index.md` (2,984 B) are emitted.
- Worktree code: `src/main.jsx:2062` has `<a href="/pricing/">Pricing</a>`; `public/pricing/index.html` +
  `index.md` exist; `functions/_middleware.js:688` registers `["/pricing", pricingMarkdown]`;
  `public/sitemap.xml` and `public/llms.txt` list the route; `scripts/check-pricing.mjs` guards it.
- Newest `origin/main` commits (2026-08-20): #130/#124/#94 — none deploys.

## Why production is 404 while main is correct

There is no deploy path from `main` to Pages:
- `.github/workflows/` contains only `ci.yml`, `review-gate.yml`, `secret-scan.yml` — no publish step.
- PR #135 (`lane1/deploy-workflow-20260820`) adds `.github/workflows/deploy.yml`: on push to main +
  daily schedule + manual dispatch, runs pricing check, unit tests, build,
  `wrangler pages deploy dist --project-name aiconverter --branch main`, then live-verifies HTTP 200.
- PR #135 checks are all green: Pricing check pass, Unit tests pass, Build pass, Gitleaks pass;
  merge state CLEAN / MERGEABLE.
- The workflow is fail-closed on two secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
  The repo currently has **zero** Actions secrets (`gh api .../actions/secrets` returns empty), so
  even merging PR #135 today leaves the lane red until they are provisioned.
- No Cloudflare credentials exist on this VPS (no wrangler binary, no `.dev.vars`, no `~/.cloudflare`
  token), so this lane cannot deploy or provision the secrets itself.

## What this lane shipped

Nothing code-wise is needed: the item's code is merged and green. What is missing is the release
path, which is PR #135, plus the secrets. This lane did not re-open a duplicate pricing PR (a
re-push of the merged fix would be an empty diff or a regression) and did not merge PR #135 (merging
is the lane controller's / Nish's call, and the merged lane still fails red until secrets exist).

## Recommended next actions (in order)

1. Nish provisions the two repo secrets (each ~2 minutes, dashboard):
   - `gh secret set CLOUDFLARE_API_TOKEN -R nish3451/aiconverter-app` — Cloudflare API token,
     "Cloudflare Pages: Edit" template, scoped to the account owning the `aiconverter` project.
   - `gh secret set CLOUDFLARE_ACCOUNT_ID -R nish3451/aiconverter-app -b <account-id>` — account id
     from the Cloudflare dashboard sidebar.
2. Merge PR #135 (`lane1/deploy-workflow-20260820`) — the deploy lane then runs on the merge push
   and publishes main to Pages.
3. Verify live: `curl -sL https://aiconverter.app/pricing/` → expect HTTP 200 with the INR pricing
   copy; then re-check `/llms.txt` and `/sitemap.xml` on the live site.
4. Update `ops/launch-venues.md`'s 2026-08-20 note (which currently records `/pricing/` as 404) once
   the route is live again.

## Lane-record state

`/home/nish/workspaces/agent-state/lanes/aiconverter-app/lane-1.json`:
- `claims` set to `[".lane/reports/lane1-pricing-route-truthful-20260820.md"]` atomically (temp file +
  rename) before any write to that path.
- No other field of the lane record was modified.

## Files touched by this lane run

- `.lane/reports/lane1-pricing-route-truthful-20260820.md` — this report (rewritten for the
  2026-08-20 live 404 finding).
- `/home/nish/workspaces/agent-worktrees/REPORT-.packet-aiconverter-app-lane1-1787245535763.md` —
  fleet-dispatch incremental report (outside the repo, per the packet's absolute contract).
- No source files modified. No commit. No branch pushed. No PR opened — because the fix is already
  on `main` and the missing piece (deploy lane) is already PR #135, green and waiting on secrets.

## Recommendation to lane controller

Mark item e3e7be0889 done in the code sense but keep the *live* acceptance criterion open: the
truthful live `/pricing/` surface goes live once PR #135 merges and the two Cloudflare secrets are
provisioned. The next lane worker re-verifying this item should check
`curl -sL https://aiconverter.app/pricing/` again.
