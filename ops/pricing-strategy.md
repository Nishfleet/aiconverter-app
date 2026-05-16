# AI Converter Pricing Strategy

## Recommendation

Launch with simple one-time packs:

- Starter: $3 for 25 pages.
- Standard: $5 for 100 pages.
- Bulk: $9 for 500 pages.

Customer-facing paid sessions use adaptive currency with fees inclusive where supported. The app should display the payment provider's checkout-preview total when available, and keep the USD pack price as the base fallback. Do not advertise the provider in the customer-facing pricing line.

The 500-page pack is intentionally aggressive. It only works because the default path is our own digital-PDF parser, with paid OCR reserved for scanned or messy files.

## Unit Economics

Based on official provider pricing checked on 2026-05-12:

- Dodo domestic card fee: 4% + $0.40.
- Mistral OCR 3: $2 per 1,000 pages, or $3 per 1,000 annotated pages.
- Azure Document Intelligence prebuilt is materially higher and should remain a rare paid-job fallback.

For a $5 standard sale:

- Dodo fee estimate: $0.60 domestic, roughly $0.70 international before taxes/FX.
- Native parser cost: effectively server compute only.
- Worst-case Mistral OCR for 100 pages: about $0.20 OCR-only or $0.30 annotated.
- Gross margin before refunds/support: about $4.00-$4.20 when OCR fallback is needed.

For a $9 bulk sale:

- Dodo fee estimate: $0.76 domestic, roughly $0.90 international before taxes/FX.
- Native parser cost: effectively server compute only.
- Worst-case Mistral OCR for 500 pages: about $1.00 OCR-only or $1.50 annotated.
- Gross margin before refunds/support: about $6.60-$8.20 depending on fallback usage and payment geography.

## Competitive Context

Visible market pricing is much higher:

- BankParse: $19/month for 500 pages.
- BankStatementConverter.org: $29/month for 400 pages.
- Bank-statement-conversion.com: roughly $0.10-$0.20/page subscription tiers and $0.50/page pay-as-you-go.

So $9 for 500 pages is a strong wedge, but the product must enforce anti-abuse controls:

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
