# Landing page — `/`

The anonymous converter workspace, SEO fallback, and home of the upload flow.
Route: `index.html` (SEO fallback) → `src/main.jsx` (React app, hydrates the
workspace). The brand name and hero h1 are pre-rendered in the static HTML so
the page is readable without JS.

## How users reach it

Open `https://aiconverter.app/` (or `http://127.0.0.1:4180/` for the local
harness). No account, no session. The `<link rel="canonical">` href in the
pre-rendered HTML points at `https://aiconverter.app/`.

## How to drive it (local)

1. `npm ci && npm run build` — emits `dist/index.html` and the hashed JS
   bundle under `dist/assets/`.
2. `npx vite preview --host 127.0.0.1 --port 4180 --strictPort`.
3. `GET /` → expect 200. The response body must contain the brand name
   `AI Converter` (used in the `<title>`, `og:title`, JSON-LD
   `SoftwareApplication.name`, and a handful of marketing strings) and
   one entry script tag pointing at `dist/assets/index-*.js`.
4. The pre-rendered `<h1>` reads `Bank statement PDFs in. Accounting CSV out.`
   — that exact string is the SEO fallback's hero, and it must survive a
   clean rebuild. The dynamic React app replaces it with the workspace
   once `main.jsx` hydrates.

```bash
curl -fsS http://127.0.0.1:4180/ -o /tmp/verify-aiconverter/home.html
grep -c 'AI Converter' /tmp/verify-aiconverter/home.html
grep -c 'Bank statement PDFs in. Accounting CSV out.' /tmp/verify-aiconverter/home.html
grep -Eo 'src="/assets/index-[A-Za-z0-9_-]+\.js"' /tmp/verify-aiconverter/home.html
grep -E 'rel="canonical" href="https://aiconverter.app/"' /tmp/verify-aiconverter/home.html
```

## How to drive it (live, for the workspace)

1. `https://aiconverter.app/` → expect 200. The same `AI Converter` brand
   and canonical must be present.
2. The workspace selector is the React app — the file-picker, the
   `Converter` dropdown, the `Output` dropdown, the `Pages` input, the
   `Email (optional)` input, the pricing card, and the `Start` button are
   all rendered by `src/main.jsx` and need a real browser (Playwright) to
   drive. The local Vite preview does NOT run `functions/api/*`, so
   selecting a file will not produce a preview; the local drive is
   shape-only proof.

## What proves success

- HTTP 200.
- `AI Converter` brand string present in the body, count ≥ 1.
- `<h1>Bank statement PDFs in. Accounting CSV out.</h1>` present in the
  pre-rendered HTML (the SEO fallback, not the React-rendered one).
- Entry script tag `src="/assets/index-…js"` present in `<body>` and
  resolves to a real file in `dist/assets/`.
- `<link rel="canonical" href="https://aiconverter.app/" />` is the
  canonical href (not `127.0.0.1:4180`).
- JSON-LD `SoftwareApplication` block is present and references
  `https://aiconverter.app/`, the same three `Offer` prices (₹399, ₹799,
  ₹1,399), and the `BusinessApplication` category.

## Local honesty note

`functions/api/*` do not run in the local Vite preview. The React app's
initial fetch to `/api/config` and `/api/pricing-preview` will fail; the
workspace renders the `Secure upload settings could not load.` and
`Pricing preview could not load.` empty states (defined in
`src/main.jsx`'s `configError` / pricing-preview `catch`). That is the
expected local shape — the live drive above is what proves the API
surface.
