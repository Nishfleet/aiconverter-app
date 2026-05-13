# AI Converter

AI Converter is a Cloudflare Pages app for preview-first file-to-CSV conversion.

Current production module:
- Bank statement PDF to CSV.

Current beta modules:
- Receipt image/PDF to expense CSV.
- Screenshot/table image/PDF to spreadsheet CSV.

## Live Infrastructure

- Public domain: `https://aiconverter.app`
- Cloudflare Pages project: `aiconverter`
- D1 database: `aiconverter`
- R2 bucket: `aiconverter-private`
- Payment provider: Dodo Payments
- OCR fallback: Mistral OCR

## Local Commands

```bash
npm ci
npm run check:pricing
node --test tests/*.test.mjs
npm run build
```

Deploy:

```bash
wrangler pages deploy dist --project-name aiconverter --branch main
```

Use the safe-deploy wrapper on Nish's machine before live commands.

## Product Truth

- Preview is free.
- Full CSV unlock is paid.
- Paid unlock is currently blocked until Dodo activates live merchant payments.
- Source files are private and short-retention.
- No human review queue.
- Do not claim universal support for every bank, receipt, screenshot, file type, or compliance regime.
