# AI Converter verification map

This folder is the maintained list of what a user can do on aiconverter.app and how to prove each thing works. Read this index, then use the matching file as the recipe.

## Baseline preconditions

- `npm ci && npm run build`, then the local preview on `http://127.0.0.1:4180` (see `../SKILL.md`, LAUNCH).
- The local preview serves the built pages only. Every `/api/*` path answers with the SPA page and 200 there, so assert bodies, never only status codes.
- Live read-only checks go to `https://aiconverter.app`. Paid, upload and admin actions on the live site are owner-only.

## Features

| Feature | File | Where it runs |
| --- | --- | --- |
| Landing page `/` | `landing-page.md` | local preview |
| Formats page `/formats/` | `formats-page.md` | local preview |
| Pricing page `/pricing/` | `pricing-page.md` | local preview |
| SEO landing pages | `bank-statement-seo-pages.md` | local preview |
| Policy pages | `policy-pages.md` | local preview |
| Conversion workspace | `conversion-workspace.md` | local preview (shape), unit tests (upload) |
| Paid path: checkout, webhook, download, redo, refund | `paid-path.md` | unit tests, live readiness, owner drills |
| Google Sheets add-on | `sheets-addon.md` | unit tests, local preview |
| Admin overview | `admin-overview.md` | live (401 check), unit tests |
| Live `/api/health` | `api-health.md` | live |
| Live `/api/config` | `api-config.md` | live |
| Live `/api/pricing-preview` | `api-pricing-preview.md` | live |

## Proof and skip reporting

- Capture the action and the resulting state: the command, the HTTP code and the body.
- Name the feature file and entry point with every artifact.
- Report an owner-only step as not run, with the reason. Never report it as verified through a different path.
- New feature files use four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, `Gotchas`.
