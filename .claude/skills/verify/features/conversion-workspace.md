# Conversion workspace — the React app on `/` after file selection

The interactive workspace is what `/` becomes once `src/main.jsx`
hydrates. It owns the `Converter` selector, the `Output` format
selector, the `Pages` input, the file picker, the `Email` input, the
Turnstile widget, the pricing card, and the result / preview table
after a file is uploaded. The shape is asserted in
`tests/preview-ui-regression.test.mjs`, the funnel events in
`tests/funnel-telemetry.test.mjs`, and the landing-page intent pickup
in `tests/landing-intent-regression.test.mjs`.

Only the Cloudflare Pages Functions runtime produces real previews;
the local Vite preview can drive the React shape but not the file
upload. The harness drives the shape with Playwright locally and
defers any paid-path / upload / preview drives to the unit tests
under `tests/`.

## How users reach it

Open `https://aiconverter.app/`, or follow any of the SEO landing
pages in `features/bank-statement-seo-pages.md` — their
`?converter=…&output=…` deep-link is what the workspace reads on
mount to pre-select the route.

## How to drive it (local, shape-only)

1. `npx vite --host 127.0.0.1 --port 4180 --strictPort` (or use
   `npx vite preview …` of the production build).
2. Open `http://127.0.0.1:4180/` in a real browser. The React app
   hydrates the workspace. The local server returns 200 on `/api/*`
   as the SPA fallback, so the workspace's
   `/api/config` and `/api/pricing-preview` fetches fail; the
   `Secure upload settings could not load.` and
   `Pricing preview could not load.` empty states render (defined in
   `src/main.jsx`'s `configError` and pricing-preview `catch`). That
   is the expected local shape.
3. Use Playwright (this repo's `playwright` is pinned to `1.62.1`):
   - Assert the `Converter` dropdown lists the eleven converter IDs
     from `src/data/converters.json`: `bank`, `receipt`, `screenshot`,
     `invoice`, `image-format`, `raster-vector`, `audio-transcript`,
     `document-markdown`, `screenshot-code`, `universal-file`,
     `email`.
   - Assert the `Output` dropdown changes when the converter
     changes (e.g. `bank` exposes `quickbooks-csv`, `xero-csv`,
     `wave-csv`, `gnucash-csv`, `csv`, `ofx`, `qbo`, `qif`).
   - Assert the workspace's pricing card reads `₹399 for 25 pages`
     (the Starter pack from `src/data/converters.json`).
   - Click the `Formats` link in the footer → land on `/formats/`
     and the route is reachable from the workspace without a session.

## How to drive it (live, for the real API surface)

The local Vite preview cannot drive the file upload. Driving the live
workspace is the same as the local drive plus:

1. Open `https://aiconverter.app/` in a real browser.
2. Confirm the `AI Converter` brand wordmark, the workspace heading,
   the `Converter` selector (default `bank`), the `Output` selector
   (default `csv`), and the file-picker drop zone are all visible.
3. Click a static page link from the footer (Privacy, Terms, Refund,
   Security, Trust, Data retention, Support) — each must return 200
   with its pre-rendered `<h1>` (see `features/policy-pages.md`).
4. The harness does NOT drive the file upload, the preview
   generation, the checkout, the paid unlock, the redo, or the admin
   surfaces — those are paid-path and abuse-protected, and their
   unit-test coverage lives in `tests/*.test.mjs`. Use
   `node --test tests/*.test.mjs` to cover the API surface, not
   curl.

## What proves success

- The local Vite dev server returns 200 on `/`, the React app
  hydrates without a console error, and the workspace's `Converter`
  and `Output` selectors list the eleven converter IDs above.
- The local workspace's pricing card reads `₹399 for 25 pages` and
  matches the Starter entry in `src/data/converters.json`.
- The local workspace renders the expected empty-state copy
  (`Secure upload settings could not load.`, `Pricing preview could
  not load.`) because `/api/*` does not run locally.
- The footer links navigate to every policy page in
  `features/policy-pages.md` and the long-tail SEO routes in
  `features/bank-statement-seo-pages.md` without a 404.
- Live: `https://aiconverter.app/api/config` and
  `/api/pricing-preview` return JSON (see the two `features/api-*.md`
  files), and the workspace's pricing card updates from the
  adaptive-currency total when called from a non-INR IP.
