# Worker entry

`functions/` is the only route source. The Pages runtime and the committed
Worker entry `worker/index.js` both derive their routes from
`functions/api/`; the repository keeps no route table.

## Build

`vite build` (npm run build) bundles `worker/index.js` as the Worker. The
entry statically bundles every module under `functions/api/` and maps each
file to the URL the Pages runtime serves it on: `functions/api/x.js` serves
`/api/x` and `functions/api/admin/x.js` serves `/api/admin/x`. A request runs
`functions/_middleware.js` first, as Pages does, and its fallback goes to the
static assets. New route files under `functions/api/` are served
automatically; no entry edit. Validation of that mapping: the Build Output
smoke `npx cf deploy --prebuilt --dry-run` reads the bundle, and the route
list stays pinned by code (the entry bundles the whole glob, never a copied
table).

## Config

`cloudflare.config.ts` carries the Worker name, bindings and static assets
settings.The production Worker is
`aiconverter`; a cf preview build of the same project deploys with no
disabled bindings on previews (see the comment in the config file).

## Deploy

CI deploys with the `cf` CLI: `.github/workflows/deploy.yml` records the
serving Worker version, applies D1 migrations, runs `cf deploy --prebuilt`,
smokes `https://aiconverter.app/` and rolls back on a failed smoke. There is
no Worker deploy route or DNS cutover for `aiconverter.app` yet; the
production hostname still serves Cloudflare Pages
(docs/ops/dns.md), and moving it to the Worker is a separate production
change. cf preview deploys deploy a preview Worker per pull request
(`cf previews deploy`), not a Pages project branch.
