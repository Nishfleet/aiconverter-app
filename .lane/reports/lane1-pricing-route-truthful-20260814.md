# Lane report: Pricing navigation route → truthful live pricing surface

Lane: aiconverter-app lane 1
Branch: `lane1/pricing-route-truthful-20260814`
Date: 2026-08-14
Item: Make the Pricing navigation route resolve to a truthful live pricing surface

## Outcome

Done. The `Pricing` nav item now resolves to a live, canonical, crawlable
`/pricing/` page instead of the in-page `#pricing` anchor (which left direct
`/pricing/` URLs hitting the 404 page).

## What shipped (10 files)

- `public/pricing/index.html` (new) — static, canonical, indexable pricing page.
  States the real one-time INR packs (Starter ₹399/25, Standard ₹799/100, Bulk
  ₹1,399/500), preview-first model, pack-assignment rules, batch limits,
  extraction-only redo, adaptive-currency note, refund/credit path, and review
  boundaries. JSON-LD Product offers match the pricing source exactly.
- `public/pricing/index.md` (new) — agent-readable markdown alternate of the
  page, byte-identical to the middleware's negotiated markdown.
- `functions/_middleware.js` — adds the `pricingMarkdown` block, registers
  `/pricing` in `markdownByRoute` (agent markdown negotiation), and lists the
  pricing page in the 404 recovery routes.
- `src/main.jsx` — nav `Pricing` link changed from `#pricing` to `/pricing/`.
- `src/styles.css` — mobile nav hide rule updated to the new `/pricing/` href.
- `public/sitemap.xml` — adds `https://aiconverter.app/pricing/`.
- `public/llms.txt`, `public/llms-full.txt` — adds the pricing page URL.
- `scripts/check-pricing.mjs` — guards the pricing page HTML + markdown + JSON-LD
  offers against the frontend/backend pricing source.
- `tests/pricing-page-regression.test.mjs` (new) — 8 tests locking the nav
  target, canonical surface, plan totals, JSON-LD, markdown negotiation parity,
  sitemap/llms listings, check-pricing guard, and truthful-boundary copy.

## Truthfulness verification (live code)

Every customer-facing claim on the page was verified against current `main`
code before shipping:

- Pack assignment uses the largest of submitted/detected/size-estimated page
  count: `functions/api/convert.js:143` (`Math.ceil(file.size / 320000)`).
- PDFs above 500 pages rejected: `functions/api/convert.js:355-356`.
- Batch checkout caps at 50 files: `functions/api/batch-checkout.js:29`.
- Redo is extraction-only, universal converters excluded:
  `functions/api/redo.js:30` (`isUniversalConverter` guard).
- Adaptive/localized checkout currency: `functions/lib/dodo.js` (adaptive
  currency + expected_currency handling).
- Middleware serves markdown for `/pricing/` on `Accept: text/markdown` and
  falls through to the static HTML otherwise — both verified 200 locally.

## Validation

- `npm run check:pricing` → "Pricing is consistent."
- `node --test tests/pricing-page-regression.test.mjs` → 8/8 pass.
- `node --test tests/*.test.mjs` → 204/204 pass.
- `npm run build` → succeeds; `dist/pricing/index.html` + `index.md` emitted;
  built bundle contains the `/pricing/` nav href.
- Middleware smoke test: markdown negotiation returns pricing markdown (200),
  HTML request falls through to static (200).

## Notes

- `ops/launch-venues.md` was intentionally left untouched: main rewrote it
  after the prior lane (2026-08-12+ NOT-EXECUTED venue notes), and forcing the
  stale dated pricing-route note would conflict with newer content. The
  pricing-route doc claim lives in llms/sitemap instead.
- The route goes live only after deploy; this branch is the change.
