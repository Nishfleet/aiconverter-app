# AI Converter

AI Converter is a Cloudflare Pages app for preview-first AI conversion plus local browser image/SVG conversion.

Current production AI module:
- Bank statement PDF to CSV.

Current beta modules:
- Receipt image/PDF to expense CSV.
- Screenshot/table image/PDF to spreadsheet CSV.
- Invoice/bill image/PDF to CSV or JSON.
- Audio file to TXT or JSON transcript.
- Rich document/image to Markdown.
- Screenshot/image to HTML starter.

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

## Local Commands

```bash
npm ci
npm run check:pricing
node --test tests/*.test.mjs
npm run stress:converters
npm run build
```

Database notes: [ops/database.md](ops/database.md)

Deploy:

```bash
wrangler pages deploy dist --project-name aiconverter --branch main
```

Use the safe-deploy wrapper on Nish's machine before live commands.

## Product Truth

- Preview is free.
- Full AI extraction unlock is paid.
- Paid unlock is currently blocked until Dodo activates live merchant payments.
- Source files are private and short-retention.
- No human review queue.
- Broad generic 200+ format conversion, video conversion, archive conversion, and pixel-perfect screenshot-to-code are not live unless a future page says otherwise.
- Do not claim universal support for every bank, receipt, invoice, screenshot, document, audio file, image, file type, or compliance regime.
