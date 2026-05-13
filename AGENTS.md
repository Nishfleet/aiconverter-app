# AI Converter Agent Notes

This repo is the durable local home for `aiconverter.app`.

## Guardrails

- Keep customer-facing copy and agent-readable Markdown truthful to live behavior.
- Do not commit secrets, API keys, `.env`, `.dev.vars`, `.wrangler`, `dist`, or `node_modules`.
- Treat Cloudflare D1, R2, Pages, and Dodo changes as live production work.
- Keep D1 as the workflow database unless a real scale/feature need appears; see `ops/database.md`.
- Run pricing, tests, audit, and build before deploy when possible.
- Keep Dodo live payment activation as an external blocker until checkout stops returning `MERCHANT_NOT_LIVE`.

## Checks

```bash
npm run check:pricing
node --test tests/*.test.mjs
npm audit --audit-level=moderate
npm run build
```

## Deploy

```bash
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' wrangler pages deploy dist --project-name aiconverter --branch main
```
