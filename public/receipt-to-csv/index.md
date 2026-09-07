---
title: Receipt to CSV
description: Turn receipt images and PDFs into reviewable expense CSV rows with a preview-first workflow when extraction confidence is high enough.
---

# Receipt to CSV

AI Converter turns receipt images and PDFs into expense CSV rows. Upload the file, check the sample rows and confidence score, then unlock the full export only when the preview is useful. Low-confidence receipts fail closed instead of inventing rows.

## Workflow

1. Upload a receipt image or PDF: PNG, JPG, JPEG, WEBP, or PDF.
2. Review the sample rows and confidence score.
3. Download the free sample CSV.
4. Unlock the full export only when the preview is useful.

## What the CSV contains

Each row carries date, vendor, category, total, currency, subtotal, tax, payment method, and notes when each field is safely detected. A multi-page PDF is treated as one row per readable receipt page, and a single page is merged into one row.

## Limits

Files up to 50 MB are accepted. PDFs may have up to 500 pages; larger files should be split before uploading. Reading receipts is OCR-sensitive: blurry photos, glare, cut-off edges, folded or handwritten receipts, and unusual layouts can fail. If a vendor and total cannot be found, or the trust score is too low, the converter refuses instead of guessing.
