# AI Converter Agent Notes

Launch stage: 2 (payments). Next trigger: the first business buyer (an accounting firm on batch checkout) who asks for a contract, a DPA or a security review (stage 3).

Success: paid conversions in the last 7 days that finished without a refund, drills left out. Baseline: 0 on 2026-10-15 (query below, read-only; only payment drills are on record). Measured by: `npx wrangler d1 execute aiconverter --remote --command "SELECT COUNT(*) FROM jobs WHERE paid_at >= strftime('%Y-%m-%dT%H:%M:%SZ','now','-7 days') AND status = 'complete' AND COALESCE(refund_status, '') = '' AND id NOT LIKE 'checkout_drill_%'"` (read-only); failures and refunds due are on `/api/admin/overview` (`npm run monitor:live`).

Stage 4's India rules already apply: uploads are bank statements and the packs are sold in INR (DPDP Act).

This repo is the durable local home for `aiconverter.app`.

## Guardrails

- Keep customer-facing copy and agent-readable Markdown truthful to live behavior.
- Do not commit secrets, API keys, `.env`, `.dev.vars`, `.wrangler`, `dist`, or `node_modules`.
- Treat Cloudflare D1, R2, Pages, and Dodo changes as live production work.
- Production DNS is authoritative at Porkbun and points to Cloudflare Pages; do not move `aiconverter.app` back to Cloudflare nameservers unless Cloudflare DNS Write/Zone Write access is present and the zone has been activated. See `docs/ops/dns.md`.
- Keep D1 as the workflow database unless a real scale/feature need appears; see `docs/ops/database.md`.
- Run pricing, tests, audit, and build before deploy when possible.
- Treat Dodo checkout creation, real payment webhook, paid finalize, download, redo, and refund proof as separate checks; checkout creation alone is not full paid-path proof.

## Checks

```bash
npm run check:pricing
node --test tests/*.test.mjs
npm audit --audit-level=moderate
npm run build
npm run stress:converters
npm run stress:live
npm run stress:checkout
npm run readiness:live
```

## Run it and prove it

Live: https://aiconverter.app.

- Prove the deploy: `npm run readiness:live`. It fetches `/api/health` and needs `ok: true`, `status: "ready"` and an empty `missing`, then checks the security headers, the markdown answer to `Accept: text/markdown`, and that `/api/admin/overview` answers 401 to a stranger. Set `AICONVERTER_STRESS_URL` to point it at a preview instead of production.
- The health route alone: `curl -s https://aiconverter.app/api/health` prints `{"ok":true,…,"status":"ready","missing":[],…}`. A non-empty `missing` names the capability that is down, and a capability that is `false` under `capabilities` is not configured on that deployment.
- Test login: none. No account or credential reaches the live site: the admin overview is 401 without the admin credential, and `readiness:live` fails if that changes.

## Deploy

Deploys go through CI, not your terminal. Every push to `main` auto-deploys
through `.github/workflows/deploy.yml`, which runs pricing check, unit tests,
build, `wrangler pages deploy dist --project-name aiconverter --branch main`,
and a live-site verification. Do not run `wrangler pages deploy` locally for
routine ships. Local deploy is break-glass only when Actions is down and no CI
deploy is in flight.

Required repo secrets (the lane fails closed and red until both exist):
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Cloudflare Pages:Edit on
  the account that owns the `aiconverter` Pages project.
- `CLOUDFLARE_ACCOUNT_ID` - the account id that owns the `aiconverter` project.

Provision once (dashboard, ~2 minutes):
1. https://dash.cloudflare.com/profile/api-tokens -> Create Token
2. Use the "Cloudflare Pages: Edit" template, scope to the owning account.
3. `gh secret set CLOUDFLARE_API_TOKEN -R nish3451/aiconverter-app`
4. `gh secret set CLOUDFLARE_ACCOUNT_ID -R nish3451/aiconverter-app -b <account-id>`
5. Re-run the Deploy lane (or wait for the next main merge / the daily schedule).

Break-glass local deploy (only when Actions is down):

```bash
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' wrangler pages deploy dist --project-name aiconverter --branch main
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
