# Homepage positioning candidates (2026-08-22)

## Context

- Item: backlog line 803 (RED, traction) — "The live product does not implement the 2026-08-14 paid-quality positioning decision"
- Positioning decision (E2 epic, Nish 2026-08-14): "paid-quality wedge: aiconverter.app leads as a professional converter/competitor-intelligence tool at a real price; the free tier exists only as a taste, never the story."
- Current SEO fallback (index.html): title "AI Converter - Useful file conversion", h1 "AI Converter for private file conversion." — stale, feature-led, not professional
- Current React app (main.jsx): h1 "Bank statement PDFs in. Accounting CSV out.", "Built for accountants, bookkeepers, and finance operators" — already professional and bank-first
- Gap: SEO fallback doesn't match the React app's positioning or the E2 decision

## Candidate A: Bank-first, aligned with React app + price signal

- title: "AI Converter - Bank statement PDF to CSV with verified previews"
- og:title / twitter:title: same
- h1: "Bank statement PDFs in. Accounting CSV out."
- description: "Professional bank statement PDF to CSV conversion. See the extraction before you pay — fail-closed, no silent errors. Built for accountants and bookkeepers. From ₹399."
- JSON-LD description: "AI Converter is a professional bank statement PDF to CSV converter built for accountants, bookkeepers, and finance operators. Preview the extraction before payment, with fail-closed behavior that refuses low-confidence results instead of hiding silent errors. Converts bank statements, receipts, invoices, and documents to clean CSV exports from ₹399."

Pros: Matches React app H1 exactly (consistency). Bank-first = the production module. Price-forward. Professional.
Cons: Title narrows to bank statements (product does more). Could limit discovery for non-bank intents.

## Candidate B: Professional converter, broader, proof-led

- title: "AI Converter - Professional file conversion with verified previews"
- og:title / twitter:title: same
- h1: "Professional file conversion with proof before payment."
- description: "Professional file conversion with verified previews. Convert bank statements, receipts, and invoices to clean CSV — see the proof before you pay. Fail-closed, no silent errors. From ₹399."
- JSON-LD description: "AI Converter is a professional file converter that puts verification before payment. Preview bank statement, receipt, and invoice extractions before paying, with fail-closed behavior that refuses low-confidence results instead of hiding silent errors. Built for accountants, bookkeepers, and finance operators. From ₹399."

Pros: Broader (doesn't narrow to bank-only). Professional. Proof-led. Price-forward.
Cons: H1 doesn't match React app H1 (slight inconsistency). Less specific than A.

## Verdict

Candidate A wins:
1. H1 matches the React app exactly — no inconsistency between SEO fallback and hydrated app
2. Bank statement PDF to CSV is the production module — leading with it is truthful
3. "Verified previews" signals the proof wedge
4. "From ₹399" is the price-forward signal from the E2 decision
5. "Built for accountants and bookkeepers" is the professional positioning
6. The body copy already mentions other formats (receipts, invoices, etc.) so the title narrowing is standard flagship-use-case practice

Candidate B's broader title is rejected because: the React app already commits to bank-first, and a broader SEO fallback would create a mismatch. The product's north star is traction, and bank statement PDF to CSV is where the production capability and buyer intent converge.
