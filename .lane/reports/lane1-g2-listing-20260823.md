# Lane 1 evidence — 2026-08-23: G2 free profile / eligibility re-verify (packet item 4eb99c12cf)

**Verdict: NOT EXECUTED — venue policy gate + reviewed vendor form; the
production bank-statement workflow remains G2-eligible, so a truthful
free-G2 submission is authorized-in-principle but is a manual external-account
action by Nish via G2's official Product Submission Form. The kit from the
2026-08-21 attempt (`.lane/reports/lane1-g2-listing-20260821.md`) is still
valid; the 2026-08-23 re-verification corrects the rationale for excluding
`/pricing/` and `/receipt-to-csv/` (they are now live HTTP 200 but remain out
of the kit's canonical-link scope). The kit is copy-paste ready.**

## The packet's condition

> "Submit and claim a truthful free G2 profile **if** the production
> bank-statement workflow meets G2's B2B/non-beta eligibility."

The condition is **MET** (re-verification below), so the item resolves to a
submit-or-decline decision for the venue, not a skip. The official G2
eligibility rule
(https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2,
fetched live 2026-08-23, re-verified 2026-08-23):

> "G2 does not accept business-to-consumer (B2C) products or products that
> are currently in the alpha or beta stage of development. To add a product:
> Fill out the Product Submission Form. G2's research team will verify
> eligibility and categorization. Once approved, claim your profile to
> manage your listing."

The production bank-statement workflow remains a released, non-beta,
B2B-facing document-conversion tool: bank statement PDF → CSV with
preview-before-pay, priced per page (₹399/25 pages, ₹799/100 pages,
₹1,399/500 pages), no bank login, source files deleted after 24 hours, and
a security/trust page (https://aiconverter.app/trust/). That is business
software in G2's document conversion / financial-adjacent categories —
not B2C, not alpha/beta.

## Why the item stays not-executed-by-agent (re-verified 2026-08-23)

1. `venue-policy.json` (re-read 2026-08-23, last updated 2026-08-08)
   lists **g2.com** in `reviewed_venues` with
   `automation_disposition: "unknown"` and the executable `allowlist` is
   **still empty** — so per the `venue-claim` contract, `claim` exits 4
   ("Allowlist/policy block") and **a blocked exit means NO browser work**,
   including no automated account creation, form submission, or
   CAPTCHA/email-verification driving. The `venue-claim` binary is now
   installed on this VPS, but the policy JSON is the authoritative guard and
   has not been updated since 2026-08-08.
2. The official G2 add-product path is a **reviewed vendor form** (Product
   Submission Form → G2 research team verifies eligibility and
   categorization in ~3-5 business days → profile goes live unclaimed →
   vendor claims it → final review within 1-3 business days; per
   https://sell.g2.com/create-a-profile, fetched live 2026-08-23). There is
   no public product-creation API and no agent-credential submission path;
   account access and email verification belong to the product owner (Nish).
3. Direct VPS access to g2.com is still bot-walled (HTTP 403 for `/` with a
   plain Mozilla UA; same as recorded 2026-08-15 and 2026-08-21), so
   agent-side verification rests on the credential-free fetch/search evidence
   recorded below.
4. Money boundary: no listing fee surfaced for the free profile path —
   sell.g2.com states "You can claim your profile for free." G2's paid
   Marketing Solutions (e.g. profile upgrades) are optional and stay Nish's
   spend call. No spend authorization exists in
   `agent-state/authorizations/` (only the sol-xhigh worker grant, expired
   2026-08-14).

## Live verification 2026-08-23 (this run, credential-free)

- Production workflow live, all HTTP 200 (re-checked 2026-08-23):
  - `/` → HTTP 200
  - `/bank-statement-pdf-to-csv/` → HTTP 200 — copy confirms a
    released, non-beta B2B tool ("Convert bank statement PDFs into
    reviewable CSV rows with preview-first extraction and short private
    file retention"; "Preview before payment"; "No bank login, no email
    intake, no manual review queue").
  - `/llms.txt` → HTTP 200
  - `/sample-csv/` → HTTP 200
  - `/trust/` → HTTP 200
  - `/formats/` → HTTP 200
  - `/pricing/` → HTTP 200 (live as of 2026-08-23; the kit does not
    claim this route).
  - `/receipt-to-csv/` → HTTP 200 (live as of 2026-08-23; the kit does not
    claim this route).
- G2 eligibility rule live (re-fetched 2026-08-23):
  `https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2`
  → HTTP 200 (B2C/alpha-beta exclusion quote unchanged from
  2026-08-15).
- Official flow live (re-fetched 2026-08-23):
  - `https://sell.g2.com/create-a-profile` → HTTP 200 — copy
    unchanged: "Create your product profile so you can gather reviews...",
    "You can claim your profile for free", steps: request form → conditional
    approval (~3-5 business days, research team vetting) → profile live &
    claimable → claim review (1-3 business days).
  - `https://sell.g2.com/claim-your-profile` → "Claim that thing for free"
    (unchanged).
- G2 free profile flow is **not** `app.g2digitalmarkets.com/get-listed/start`;
  that portal is the Capterra/GetApp/Software Advice vendor back-office and
  is out of scope for this packet. The G2 free profile flow remains
  `sell.g2.com/create-a-profile` and
  `documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2`; the
  manual kit's field set is unchanged.
- Direct g2.com access (re-checked 2026-08-23):
  `https://www.g2.com/` with a plain Mozilla/Chrome UA → HTTP **403**
  (bot-walled; same as 2026-08-15 and 2026-08-21).
- No duplicate re-check: no new g2.com profile for aiconverter.app / "AI
  Converter" has been published since 2026-08-21 (the venue's review queue
  publishes slowly; the peer profile
  https://www.g2.com/products/bank-statement-converter-ai-online/reviews
  is still the only exact-category listing on G2).

## Decision

- **DECLINED for agent-executed submission; SUBMIT (manual, by Nish) — free
  G2 profile.** The truthful kit below is copy-paste ready. This line flips
  to SUBMITTED (with the public profile URL) once Nish acts.
- Next action (human-owned, unchanged): Nish opens the official Product
  Submission Form (linked from
  https://documentation.g2.com/help/docs/finding-or-listing-a-product-on-g2
  and https://sell.g2.com/create-a-profile), submits using the kit below,
  waits for conditional approval, then claims the profile, then
  `ops/launch-venues.md` should be updated with the public profile URL
  (g2.com/products/{slug}) and the venue's status line flipped to live.
- The only route to an agent-executed submission would be the venue research
  desk reviewing g2.com and adding it to the policy allowlist — and even
  then the reviewed form's email verification and account ownership stay
  with Nish.

## Manual submission kit (carried forward from 2026-08-21; truthful — live claims only)

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
- Canonical links for the listing (all verified live HTTP 200 on 2026-08-23):
  - https://aiconverter.app/
  - https://aiconverter.app/bank-statement-pdf-to-csv/
  - https://aiconverter.app/sample-csv/
  - https://aiconverter.app/trust/
  - https://aiconverter.app/formats/
- Post-listing check: the public profile resolves and links
  https://aiconverter.app/ and a live canonical bank-statement page; copy
  avoids blanket accuracy/bank-support claims and does not reference
  `/pricing/` or `/receipt-to-csv/` — they are live (HTTP 200 as of
  2026-08-23) but are out of the kit's canonical-link scope; the kit's
  links remain `/`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`,
  `/trust/`, `/formats/`; then update `ops/launch-venues.md` with the public
  URL (g2.com/products/{slug}).

# PACKET COMPLETE
