---
title: Receipt to CSV
description: Turn receipt photos and PDFs into expense CSV with free preview rows first, beta OCR extraction, and private short-retention handling.
---

# Receipt to CSV

AI Converter turns receipt images and PDFs into expense CSV. Upload the receipt, check sample rows first, then unlock the full CSV only when the preview looks useful. No receipt login, no email intake, no manual review queue.

## Workflow

1. Upload a receipt image (PNG, JPG, WEBP) or PDF up to 50 MB.
2. Review sample expense rows before payment.
3. Unlock the full CSV if the preview is usable.
4. Download rows with date, vendor, category, total, currency, subtotal, tax, payment method, and notes when safely detected.

## Pricing

- Free preview.
- ₹399 for up to 25 pages.
- ₹799 for up to 100 pages.
- ₹1,399 for up to 500 pages.

Receipt PDFs are priced by detected page count; a receipt photo counts as a single page.

## Limits

This route is beta and uses OCR. Files can fail when they are password-protected, corrupted, blurred, low-quality, unusual, or too large. Low-confidence extraction fails closed with no charge, and AI Converter does not claim every receipt layout or language is supported.

No receipt account or bank login is requested. The export should be reviewed before expense reporting, reimbursement, or tax use.

## Privacy

Source files are stored privately and never used to train models. They are deleted after a failed preview, failed full extraction, completed redo, or the 24-hour source lifecycle. Generated files expire after 7 days, and support requests should use job IDs rather than pasted receipt contents.
