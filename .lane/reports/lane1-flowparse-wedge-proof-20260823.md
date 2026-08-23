# Lane 1 evidence: proof-mechanics wedge copy defense

**Branch:** `lane1/flowparse-wedge-proof-20260823`

## Files changed and why

| File | Why |
|------|-----|
| `src/main.jsx` | Homepage announcement bar, hero chip, lede, and workflow step now lead with sample-row preview, no-charge fail-closed stop, and GnuCash — not generic "verified preview" language. |
| `index.html` | SEO fallback title/meta/JSON-LD and no-JS body swap "verified preview" for concrete proof mechanics. |
| `public/llms.txt` | Agent-readable wedge section renamed to "Proof before payment" with redo and sample-CSV bullets. |
| `public/llms-full.txt` | Full agent context section aligned to proof-before-payment framing. |
| `public/bank-statement-pdf-to-csv/index.html` | Meta descriptions, verification policy card, and seo-detail block use proof mechanics. |
| `public/convert-bank-statement-to-csv/index.html` | Meta + seo-detail proof copy. |
| `public/pdf-bank-statement-to-quickbooks-csv/index.html` | Meta + seo-detail proof copy (QuickBooks-specific first paragraph). |
| `public/pdf-bank-statement-to-xero-csv/index.html` | Meta + seo-detail proof copy (Xero-specific first paragraph). |
| `public/pdf-bank-statement-to-wave-csv/index.html` | Meta + seo-detail proof copy (Wave-specific first paragraph). |
| `public/scanned-bank-statement-to-excel/index.html` | Meta + seo-detail proof copy (OCR sample emphasis). |
| `public/credit-card-statement-pdf-to-csv/index.html` | Meta + seo-detail proof copy (charges/credits columns). |
| `public/bank-statement-converter-for-bookkeepers/index.html` | Meta + seo-detail proof copy (client statement framing). |
| `tests/first-viewport-audience-regression.test.mjs` | Hero chip assertion updated to new wording. |

## Claim → live behavior mapping

| New claim | Live behavior |
|-----------|---------------|
| "Review sample rows before you pay" / "detected sample rows" | Free preview surfaces actual parsed rows (dates, descriptions, money in/out, balance when detected) before checkout. |
| "Unsafe parse? No charge" / "you are not charged" | Low-confidence or unsafe parses fail closed; payment is not taken when preview cannot be trusted. |
| "totals do not match, the job stops" | Validation checks reconcile totals; unreliable previews block progression. |
| "One automatic stronger redo" | Paid extraction jobs include one stronger automatic redo within the source retention window. |
| "fictional sample CSV" | `/sample-csv/` shows output column shape before upload. |
| "GnuCash" in hero lede | GnuCash CSV is a live bank-statement output format in the conversion catalog. |

## Validation output

### `npm run check:pricing`

```
Pricing is consistent.
```

Exit code: 0

### `node --test tests/*.test.mjs`

```
ℹ tests 235
ℹ pass 235
ℹ fail 0
```

Exit code: 0

### `npm run build`

```
✓ built in 1.25s
```

Exit code: 0

## PR

Pending — will update after `gh pr create`.
