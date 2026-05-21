# AI Converter Pricing Strategy

## Recommendation

Launch with simple one-time packs. The local plan amounts below are internal product configuration targets, not customer-facing pricing copy:

- Starter: ₹399 for 25 pages.
- Standard: ₹799 for 100 pages.
- Bulk: ₹1,399 for 500 pages.

Customer-facing paid sessions must display the live Dodo checkout-preview total and currency. If Dodo preview cannot load, checkout should pause visibly instead of showing a fixed INR fallback. Static pages and agent-readable Markdown should describe preview-first paid unlocks without publishing fixed plan prices.

The 500-page pack is intentionally aggressive. It only works because the default path is our own digital-PDF parser, with paid OCR reserved for scanned or messy files.

## Pricing Ownership

Dodo checkout preview is the visible source of truth for customer-facing price and currency. The repo still keeps internal plan IDs, page limits, and target amounts so checkout, tests, and optional Dodo product sync can agree on the intended packs.

`npm run dodo:sync-prices` is an operator command, not an automatic release step. If it is used, treat the repo plan config as the source that pushes product amounts into Dodo; otherwise treat the Dodo dashboard/product setup as canonical and use `/api/pricing-preview` to render what Dodo will charge.

## Unit Economics

Based on official provider pricing checked on 2026-05-12:

- Dodo domestic card fee: 4% + $0.40.
- Mistral OCR 3: $2 per 1,000 pages, or $3 per 1,000 annotated pages.
- Azure Document Intelligence prebuilt is materially higher and should remain a rare paid-job fallback.

For a ₹799 standard sale:

- Dodo fee estimate: depends on the live Indian payment mix and taxes.
- Native parser cost: effectively server compute only.
- Worst-case Mistral OCR for 100 pages: about $0.20 OCR-only or $0.30 annotated.
- Gross margin remains strong when OCR fallback is only used for files that need it.

For a ₹1,399 bulk sale:

- Dodo fee estimate: depends on the live Indian payment mix and taxes.
- Native parser cost: effectively server compute only.
- Worst-case Mistral OCR for 500 pages: about $1.00 OCR-only or $1.50 annotated.
- Gross margin before refunds/support depends on fallback usage and payment geography.

## Competitive Context

Visible market pricing is much higher:

- BankParse: $19/month for 500 pages.
- BankStatementConverter.org: $29/month for 400 pages.
- Bank-statement-conversion.com: roughly $0.10-$0.20/page subscription tiers and $0.50/page pay-as-you-go.

So the 500-page pack can still be a strong wedge, but the product must enforce anti-abuse controls:

- server-side page estimation,
- hard rejection above 500 pages,
- OCR preview capped to the first page by default,
- exact-file preview reuse limits,
- hourly and daily upload limits,
- one automatic stronger redo per paid job,
- unique payment ID binding,
- cash refunds only when a usable CSV was not already delivered,
- source PDF retention capped by code plus the R2 1-day lifecycle rule.

## Sources

- https://docs.mistral.ai/models/model-cards/ocr-3-25-12
- https://dodopayments.com/pricing
- https://docs.dodopayments.com/api-reference/refunds/post-refunds
- https://www.bankparse.com/pricing
- https://bankstatementconverter.org/pricing/
- https://bank-statement-conversion.com/en/pricing
