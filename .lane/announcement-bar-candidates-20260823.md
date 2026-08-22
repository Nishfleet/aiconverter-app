# Announcement bar positioning candidates — 2026-08-23

## Context
The 2026-08-14 E2 positioning decision committed to "paid-quality wedge: aiconverter.app leads as a professional converter at a real price; the free tier exists only as a taste, never the story." PR #168 fixed the SEO fallback title/description/JSON-LD but the hydrated React app's announcement bar still leads with "Free sample CSV before checkout" — the free-preview story. The hero chip also says "Preview and sample before checkout". This PR fixes the announcement bar and hero chip to lead with the paid-quality positioning.

## Candidate A — professional + price lead
Announcement bar:
- `<p>Verified previews. Fail-closed extraction. From ₹399.</p>`
- `<a href="#start">Try a real statement →</a>`

Hero chip:
- `<span>Verified preview before you pay</span>`

Rationale: leads with the three things the E2 decision named — professional (verified), quality (fail-closed), and real price (₹399). The CTA drops "free" from the bar but the hero copy below still mentions the free sample. Price is truthful (live pricing page: Starter ₹399).

## Candidate B — quality-claim lead (no price in bar)
Announcement bar:
- `<p>Fail-closed extraction with verified previews.</p>`
- `<a href="#start">Preview a real statement →</a>`

Hero chip:
- `<span>Verified rows before you pay</span>`

Rationale: leads with the fail-closed quality claim (the wedge FlowParse is contesting). No price in the bar keeps it less aggressive but still quality-forward, not free-forward. Price is visible in the nav "Pricing" link and the pricing page.

## Verdict
Candidate A wins. The E2 decision explicitly says "at a real price" — the bar should carry the price. Candidate A's three-claim bar (verified previews + fail-closed + price) is the most direct expression of the positioning decision and is fully truthful against live behavior. Candidate B is good but omits the price signal the decision requires.

All claims verified against live product:
- "Verified previews" — the product shows a preview before payment (true)
- "Fail-closed extraction" — low-confidence jobs stop without export (true, documented in llms.txt)
- "From ₹399" — live pricing page shows Starter ₹399 (true)
- "Try a real statement" — the converter accepts real bank statement PDFs (true)
