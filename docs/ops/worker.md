# Worker entry

`functions/` is the only route source. The Cloudflare Pages runtime and the
Worker entry both derive their routes from the files under `functions/api/`;
the repository keeps no route table.

## Build

```bash
npm run worker:build
```

That runs the Wrangler command the deploy lane already pins:

```bash
npx --yes wrangler@4.135.0 pages functions build --outdir=.worker
```

It writes `.worker/index.js`, which is git-ignored. The generated entry runs
`functions/_middleware.js` first and falls back to `env.ASSETS` for a request
that matches no function. A Worker host must bind the built site to `ASSETS`
and supply the bindings listed in `wrangler.jsonc`.

## Deploy

Production still deploys to Cloudflare Pages: `.github/workflows/deploy.yml`
runs `wrangler pages deploy dist --project-name aiconverter --branch main`.
This repository has no Worker deploy config, route, or DNS cutover for
`aiconverter.app`. The generated entry is not wired into the deploy lane;
moving production to a Worker is a separate production change.
