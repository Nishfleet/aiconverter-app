# Pricing page — `/pricing/`

Public pricing page. The base INR pack prices (₹399, ₹799, ₹1,399) are
baked into the pre-rendered HTML so the page is readable without JS, and
the React app hydrates the live preview with adaptive-currency totals
from `/api/pricing-preview` when configured.

## How users reach it

Open `https://aiconverter.app/pricing/` (or `http://127.0.0.1:4180/pricing/`
for the local harness), or follow the `Pricing` link in the homepage
header / footer.

## How to drive it (local)

1. `GET /pricing/` → expect 200. The pre-rendered HTML must contain:
   - `<title>Pricing - AI Converter one-time page packs</title>`.
   - `<link rel="canonical" href="https://aiconverter.app/pricing/" />`.
   - `<h1>Simple per-pack pricing.</h1>`.
   - The three plan price strings exactly:
     - `₹399 for 25 pages`
     - `₹799 for 100 pages`
     - `₹1,399 for 500 pages`
   - The `Free preview first.` plan note (Starter).

```bash
curl -fsS http://127.0.0.1:4180/pricing/ -o /tmp/verify-aiconverter/pricing.html
grep -F 'Simple per-pack pricing.' /tmp/verify-aiconverter/pricing.html
grep -F '₹399 for 25 pages' /tmp/verify-aiconverter/pricing.html
grep -F '₹799 for 100 pages' /tmp/verify-aiconverter/pricing.html
grep -F '₹1,399 for 500 pages' /tmp/verify-aiconverter/pricing.html
grep -F 'Free preview first.' /tmp/verify-aiconverter/pricing.html
grep -E 'rel="canonical" href="https://aiconverter.app/pricing/"' /tmp/verify-aiconverter/pricing.html
```

The plan IDs in `src/data/converters.json` are `starter`, `batch`, `pro`
(in that order: 25, 100, 500 pages). The plan IDs in
`/api/pricing-preview` use the same three keys — see
`features/api-pricing-preview.md`.

## How to drive it (live, for the adaptive currency card)

1. `https://aiconverter.app/pricing/` → expect 200, same base prices.
2. The page calls `/api/pricing-preview` and (when Dodo is configured
   and adaptive checkout pricing is enabled) replaces the three INR
   strings with a localized total in the caller's currency. Drive this
   with a browser from a non-INR IP:

```bash
curl -fsS https://aiconverter.app/api/pricing-preview
# Expect JSON with: available, provider, country, prices.starter|batch|pro
# Each plan has display (locale string), amount (minor units), currency.
```

## What proves success

- HTTP 200.
- The three plan price strings above are present, in order, and exactly
  match the plan IDs in `src/data/converters.json` (`pricing[].id` is
  `starter`, `batch`, `pro`; `pricing[].pages` is 25, 100, 500).
- `rel="canonical"` is `https://aiconverter.app/pricing/`, not the
  loopback origin.
- The `Free preview first.` plan note survives a clean rebuild
  (`scripts/build-sitemap.mjs` regenerates `dist/sitemap.xml`, the
  pricing copy itself is built from `dist/legal.css` plus the React
  hydration, so a rebuild that drops the note is a content bug).
