# Lane 1 evidence — 2026-08-15: G2 free profile / eligibility (packet item 4eb99c12cf)

**Verdict: NOT EXECUTED — venue policy gate + reviewed vendor form; the
production bank-statement workflow IS G2-eligible, so a truthful free-G2
submission is authorized-in-principle but is a manual external-account action
by Nish via G2's official Product Submission Form. Kit recorded below.**

## The packet's condition

> "Submit and claim a truthful free G2 profile **if** the production
> bank-statement workflow meets G2's B2B/non-beta eligibility."

The condition is **MET** (evidence below), so the item resolves to a
submit-or-decline decision for the venue, not a skip. The official G2
eligibility rule (https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2,
published 2025-09-18, fetched live 2026-08-15):

> "G2 does not accept business-to-consumer (B2C) products or products that
> are currently in the alpha or beta stage of development. To add a product:
> Fill out the Product Submission Form. G2's research team will verify
> eligibility and categorization. Once approved, claim your profile to
> manage your listing."

The production bank-statement workflow is a released, non-beta, B2B-facing
document-conversion tool: bank statement PDF → CSV with preview-before-pay,
priced per page (₹399/25 pages, ₹799/100 pages, ₹1,399/500 pages), no bank
login, source files deleted after 24 hours, and a security/trust page
(https://aiconverter.app/trust/). That is business software in G2's document
conversion / financial-adjacent categories — not B2C, not alpha/beta.

## Why the item stays not-executed-by-agent

1. `venue-policy.json` (re-read 2026-08-15, updated 2026-08-08) lists
   **g2.com** in `reviewed_venues` with `automation_disposition: "unknown"`
   and the executable `allowlist` is **empty** — so per the `venue-claim`
   contract (`agent-state/growth-loop/venue-claim.md`), `claim` exits 4
   ("Allowlist/policy block") and **a blocked exit means NO browser work**,
   including no automated account creation, form submission, or
   CAPTCHA/email-verification driving. The `venue-claim` binary is not
   installed in the lane environment
   (`/home/nish/.local/bin/venue-claim: No such file or directory`), but the
   policy JSON is the authoritative guard and it has not been updated.
2. The official G2 add-product path is a **reviewed vendor form** (Product
   Submission Form → G2 research team verifies eligibility and
   categorization in ~3-5 business days → profile goes live unclaimed →
   vendor claims it → final review within 1-3 business days; per
   https://sell.g2.com/create-a-profile, fetched live 2026-08-15). There is
   no public product-creation API and no agent-credential submission path;
   account access and email verification belong to the product owner (Nish).
3. Direct VPS access to g2.com is bot-walled (HTTP 403 for `/`, `/products/new`,
   `/sellers`; robots.txt live HTTP 200 and disallows `/login`, `/authorize`,
   `/identities/start_login`, `/products/new`-family paths are not crawlable
   from here), so agent-side verification rests on the credential-free
   fetch/search evidence recorded below.
4. Money boundary: no listing fee surfaced for the free profile path —
   sell.g2.com states "You can claim your profile for free." G2's paid
   Marketing Solutions (e.g. profile upgrades) are optional and stay Nish's
   spend call. No spend authorization exists in
   `agent-state/authorizations/` (only the sol-xhigh worker grant, expired
   2026-08-14).

## Live verification 2026-08-15 (this run, credential-free)

- Production workflow live, all HTTP 200: `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`,
  `/robots.txt`. The bank-statement page copy confirms a released,
  non-beta B2B tool ("Upload the PDF, check sample rows first, then unlock
  the full CSV only when the preview looks useful... Pricing starts at ₹399
  for up to 25 pages... No bank login, no email intake, no manual review
  queue").
- G2 eligibility rule live: `https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2`
  → HTTP 200 (the B2C/alpha-beta exclusion quote above).
- Official flow live: `https://sell.g2.com/create-a-profile` → HTTP 200 —
  "Create your product profile so you can gather reviews...", "You can claim
  your profile for free", steps: request form → conditional approval (~3-5
  business days, research team vetting) → profile live & claimable → claim
  review (1-3 business days). Also `https://sell.g2.com/claim-your-profile`
  ("Claim that thing for free").
- No duplicate (G2 bot-walled from this VPS; checked via web search 2026-08-15):
  no g2.com product profile for aiconverter.app / "AI Converter" surfaced;
  Wayback availability API returns no archived snapshots for
  g2.com/products/aiconverter, /products/ai-converter, /aiconverter,
  /ai-converter. G2 hosts the exact category via a live peer profile:
  **Bank Statement Converter AI Online**
  (https://www.g2.com/products/bank-statement-converter-ai-online/reviews,
  surfaced in search results 2026-08-15; direct fetch timed out — G2 pages
  are slow/bot-walled from here).
- Kit reference pages all live HTTP 200 (2026-08-15): the six URLs above;
  `/pricing/` and `/receipt-to-csv/` still 404 (unchanged; the kit claims
  none of those routes).

## Decision

- **DECLINED for agent-executed submission; SUBMIT (manual, by Nish) — free
  G2 profile.** The truthful kit below is copy-paste ready. This line flips
  to SUBMITTED (with the public profile URL) once Nish acts.
- Next action (human-owned): Nish opens the official Product Submission Form
  (link from https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2
  and https://sell.g2.com/create-a-profile), submits using the kit below,
  waits for conditional approval, then claims the profile, then this file
  should be updated with the public profile URL
  (g2.com/products/{slug}) and the venue's status line flipped to live.
- The only route to an agent-executed submission would be the venue research
  desk reviewing g2.com and adding it to the policy allowlist — and even
  then the reviewed form's email verification and account ownership stay
  with Nish.

## Manual submission kit (copy-paste ready; truthful — live claims only)

- Name: **AI Converter**
- Tagline: **Bank statement PDFs to CSV you can review before paying**
- Website: https://aiconverter.app
- Description:

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your
  > browser. Review sample rows free, then unlock the full extraction only when
  > the preview looks right. OCR fallback handles scanned statements; low
  > confidence fails closed with no charge. No bank logins and no human review
  > queue; source files are deleted after 24 hours.

- Key features (3-5 bullets):
  - Bank statement PDF to CSV with a built-in parser first, OCR fallback for scans.
  - Free preview: review sample rows and download a sample CSV before paying.
  - Fail-closed extraction: low-confidence conversions are not charged.
  - No bank login and no human review queue; source files deleted after 24 hours.
  - Paid jobs get one automatic stronger redo.
- Category: match the live peer's placement — the peer profile
  (https://www.g2.com/products/bank-statement-converter-ai-online/reviews)
  is an exact PDF-bank-statement-to-Excel/CSV converter; pick the closest
  category the form offers (document conversion / financial-adjacent). Do
  not invent a category slug.
- Pricing tag: Freemium (free preview + paid per-page extraction, matching
  live checkout behavior).
- Canonical links for the listing (all verified live HTTP 200 on 2026-08-15):
  - https://aiconverter.app/bank-statement-pdf-to-csv/
  - https://aiconverter.app/sample-csv/
  - https://aiconverter.app/trust/
  - https://aiconverter.app/formats/
- Post-listing check (per the packet's verify criteria): the public profile
  resolves and links https://aiconverter.app/ and a live canonical
  bank-statement page; copy avoids blanket accuracy/bank-support claims and
  never references undeployed `/pricing/` or `/receipt-to-csv/`; then update
  this file with the public URL.
