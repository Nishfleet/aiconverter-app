# NEEDS-NISH — aiconverter-app — 2026-08-21

Items from the product scout audit that require Nish's human action (pricing, brand, legal, delete, or account-level operations).

---

## [2026-08-21] [aiconverter-deploy-secrets] DEPLOY — Cloudflare API token + account ID provisioning

**Priority:** revenue (blocking)
**Slug:** aiconverter-deploy-secrets
**What:** The CI deploy workflow (`deploy.yml`) requires two GitHub secrets that don't exist:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Pages:Edit scope on the account owning the `aiconverter` Pages project.
- `CLOUDFLARE_ACCOUNT_ID` — Account ID that owns the `aiconverter` Pages project.

**Why it needs Nish:** Only Nish can create the API token in the Cloudflare dashboard (https://dash.cloudflare.com/profile/api-tokens) and set the secrets via `gh secret set`.

**Evidence:**
- `.github/workflows/deploy.yml` references both secrets
- `AGENTS.md` — "Required repo secrets (the lane fails closed and red until both exist)"
- `README.md` — Deploy section: "Provision once (dashboard, ~2 minutes)"
- Commit 07ad709 — deploy workflow merged to main but non-functional

**Impact:** ALL merged improvements (stale-dodo-event fix, landing-intent-preselect feature, pricing route fix) are dead code until deploy works. Blocking revenue.

**Action:**
1. Go to https://dash.cloudflare.com/profile/api-tokens → Create Token
2. Use "Cloudflare Pages: Edit" template, scope to the owning account.
3. `gh secret set CLOUDFLARE_API_TOKEN -R nish3451/aiconverter-app`
4. `gh secret set CLOUDFLARE_ACCOUNT_ID -R nish3451/aiconverter-app -b <account-id>`
5. Trigger the deploy workflow (or wait for next main push)

---

## [2026-08-21] [aiconverter-dodo-live] OPERATIONAL — Verify Dodo merchant live status

**Priority:** revenue (medium)
**Slug:** aiconverter-dodo-live
**What:** The checkout flow has a `MERCHANT_NOT_LIVE` error handler. It's unclear whether Dodo live payments are currently activated for the aiconverter.app merchant ID.

**Why it needs Nish:** Dodo dashboard access (Nish-only). Need to confirm whether live payments are active or if the MERCHANT_NOT_LIVE guard should be removed.

**Evidence:**
- `functions/api/checkout.js:51-54` — catches `MERCHANT_NOT_LIVE` and returns 503 with message "Dodo live payments are not enabled for this merchant yet."
- `functions/lib/dodo.js` — Dodo checkout creation calls Dodo's live API
- README — lists Dodo Payments as the payment provider

**Action:**
1. Log into Dodo dashboard
2. Check merchant status (live/test/suspended)
3. If live, the error path is dead code — can be removed
4. If not live, activate live payments or update checkout to explain the status

---

## [2026-08-21] [aiconverter-dodo-wallet] OPERATIONAL — Fund Dodo wallet for drill + refund capability

**Priority:** revenue (blocking for paid-drill)
**Slug:** aiconverter-dodo-wallet
**What:** The Dodo wallet is underfunded. The ₹299 drill refund (2026-05-18) failed five times with "Insufficient funds in wallet" and was written off. A new real-card drill needs wallet funds for the refund leg.

**Why it needs Nish:** Only Nish can add funds to the Dodo wallet. This is a payment account action.

**Evidence:**
- `ops/refund-writeoffs.md` decision 2026-08-10 — "the wallet has not held ₹299 for three months"
- `scripts/paid-drill-live.mjs` — drill script exists and ready
- README — "One successful real-card drill...still needs operator proof"

**Action:**
1. Log into Dodo dashboard
2. Add ~₹500 to wallet (₹299 for drill refund + buffer)
3. Run `npm run drill:paid` from an environment with Dodo secrets
4. If the refund leg succeeds, the paid-drill item is done

---

## [2026-08-21] [aiconverter-customer-trials] OPERATIONAL — Recruit and observe 5 customer trials

**Priority:** revenue (high)
**Slug:** aiconverter-customer-trials
**What:** Recruit 5 real bookkeepers/SMB operators with real conversion tasks, observe them using the product, grant free full export via per-job D1 `paid_at` grant.

**Why it needs Nish:** Requires Nish's human network (LinkedIn, WhatsApp), live session observation with participant consent, and D1 admin access for the per-job grant.

**Evidence:**
- `ops/customer-trials.md` — full kit with recruitment copy, session protocol, evidence template
- Option A (per-job D1 grant) verified: `UPDATE jobs SET paid_at = '<date>', payment_id = 'trial:<id>' WHERE id = '<job id>'`
- `tests/download-gate.test.mjs` — locks free-download semantics
- README — `FREE_DOWNLOADS_ENABLED=false` in production

**Action:**
1. Use the recruitment copy from `ops/customer-trials.md` to reach out
2. Screen for intent match (real current conversion task)
3. Schedule 5 observed sessions (~25 min each)
4. After each session, grant free export via D1 `UPDATE` (Option A)
5. Record findings in the evidence template in `ops/customer-trials.md`

---

## [2026-08-21] [aiconverter-launch-venues] VENUE — Manual submissions for 15 venues

**Priority:** growth (medium)
**Slug:** aiconverter-launch-venues
**What:** 15 launch venues researched (Product Hunt, BetaList, WeLikeTools, xix.ai, Toolbit.ai, Toolify.ai, Microlaunch, Uneed, Open-Launch, SaaSHub, Capterra, G2, Futurepedia, TAAFT, Dang.ai). All need Nish's human action (account creation OAuth, paid spend decisions, or manual submission).

**Why it needs Nish:** Venue policy ledger prohibits agent-driven submissions for all 15 venues (automation_disposition: prohibited for Product Hunt; unreviewed/unknown for the rest). Paid spend decisions ($9.90 xix.ai, $99 Toolify, $39 Microlaunch Pro, $29.99 Uneed STWL, $12 Open-Launch Premium) are Nish-only.

**Evidence:**
- `ops/launch-venues.md` — kits prepared for all venues, re-verified 2026-08-14/15/16/17
- `agent-state/growth-loop/venue-policy.json` — policy gate

**Action:** 
1. Decide spend budget for paid venues
2. Submit using the prepared kits in `ops/launch-venues.md`
3. Update `ops/launch-venues.md` with public URLs after each submission

---

## [2026-08-21] [aiconverter-serp-anchor] PRODUCT — Decide and implement SERP free anchor

**Priority:** growth (high, ties to revenue)
**Slug:** aiconverter-serp-anchor
**What:** The paid-quality wedge decision was reached 2026-08-14, but execution needs a concrete free anchor (e.g., first 5 pages free) or trust/quality differentiation to enter the core-phrase SERP.

**Why it needs Nish:** This is a product/pricing decision — offering a free anchor changes the product's fundamental positioning. Software implementation can be delegated but the decision is Nish's.

**Evidence:**
- `ops/serp-wedge-evidence.md` — live SERP analysis showing indexed-but-absent
- Epics.md (improvement-loop) — positioning decision "B" (paid-quality wedge) on 2026-08-14
- Page-1 organic is 100% free-positioned

**Action:**
1. Decide: free anchor (first N pages free) vs pure paid-quality wedge vs another approach
2. If free anchor: implement code change, update pricing, deploy
3. If paid-quality: invest in trust signals (reviews, case studies, directory presence) to rank against free competitors
