# AI Converter

AI Converter is a Cloudflare Pages app for preview-first AI conversion, common file conversion, and browser-only image conversion.

Current production AI module:
- Bank statement PDF to CSV.

Current beta modules:
- Receipt image/PDF to expense CSV.
- Screenshot/table image/PDF to spreadsheet CSV.
- Invoice/bill image/PDF to CSV or JSON.
- Audio file to TXT or JSON transcript.
- Rich document/image to Markdown.
- Screenshot/image to HTML, with a free starter preview and paid Workers AI vision export when configured.
- Universal file conversion through CloudConvert, with Convertio backup when `CONVERTIO_API_KEY` is configured.

Current local module:
- PNG/JPG/WEBP to PNG/JPG/WEBP in the browser with no upload.
- PNG/JPG/WEBP to posterized SVG in the browser with no upload.

## Live Infrastructure

- Public domain: `https://aiconverter.app`
- Cloudflare Pages project: `aiconverter`
- D1 database: `aiconverter`
- R2 bucket: `aiconverter-private`
- Payment provider: Dodo Payments
- OCR and document extraction fallback: Mistral OCR
- Speech recognition and Markdown conversion: Cloudflare Workers AI
- Universal provider conversion: CloudConvert
- Universal provider backup: Convertio

## Local Commands

```bash
npm ci
npm run check:pricing
node --test tests/*.test.mjs
npm run stress:converters
npm run build
npm run monitor:live
npm run stress:live
npm run stress:checkout
npm run readiness:live
```

Database notes: [ops/database.md](ops/database.md)
Monitoring notes: [ops/monitoring.md](ops/monitoring.md)

Deploy:

```bash
wrangler pages deploy dist --project-name aiconverter --branch main
```

Use the safe-deploy wrapper on Nish's machine before live commands.

## Product Truth

- Preview is free.
- Full AI extraction unlock is paid.
- Dodo checkout, webhook, paid finalize, download, and failed-payment handling are live-tested. Cash refund retry is implemented; current live refund proof is blocked until the Dodo wallet has enough funds.
- Source files are private and short-retention.
- No human file review queue.
- Provider-backed universal conversion is implemented and activates when the production `CLOUDCONVERT_API_KEY` or `CONVERTIO_API_KEY` secret is configured.
- CloudConvert is the primary universal provider route when the production `CLOUDCONVERT_API_KEY` secret is configured.
- Convertio backup conversion is implemented when the production `CONVERTIO_API_KEY` secret is configured.
- CloudConvert daily cap/credit reserve and Convertio daily cap guardrails are enforced before new provider jobs start.
- Pixel-perfect screenshot-to-code is not live.
- Do not claim universal support for every bank, receipt, invoice, screenshot, document, audio file, image, file type, or compliance regime.
