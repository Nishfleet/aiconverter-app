# Lane 1 evidence — 2026-08-15: Capterra vendor profile (packet item 83c4f2d087)

**Verdict: NOT EXECUTED — the Capterra decline decision is re-recorded with a
truthful manual kit. The prior record of this decision (PR #59, branch
`lane1/capterra-listing-20260811`) was closed unmerged on 2026-08-14, so main
had no Capterra decision at all; this run re-records it, re-verified live
2026-08-15, and lands it on main via PR.**

## The one item

> Create a truthful Capterra vendor profile or record a decline — Capterra
> already has a current bank-statement-conv[erter category; the listing is
> missing].

The packet allows either outcome. The decline is recorded (below), the kit is
truthful and copy-paste ready for Nish, and the blocker is fully explained.

## Decision (dated 2026-08-11, re-verified 2026-08-15) — DECLINED for agent-executed submission

- **Capterra: DECLINE agent-executed submission. Truthful profile creation is
  a manual external-account action by Nish via the official Gartner Digital
  Markets get-listed flow.** The kit in `ops/launch-venues.md` (Capterra
  section) is copy-paste ready and truthful; the line flips to SUBMITTED (or
  stays DECLINED) once Nish acts.
- Why the agent cannot do it:
  1. **Venue policy ledger (unchanged).** `agent-state/growth-loop/venue-policy.json`
     (updated 2026-08-08, re-read 2026-08-15) lists capterra.com with
     `automation_disposition: "unknown"` and the executable `allowlist` is
     empty → `venue-claim claim` exits 4 → "A blocked exit means NO browser
     work" (no automated submission, no account creation). The `venue-claim`
     binary is not installed on this VPS (exit 127), but the policy JSON is
     the authoritative guard and it has not changed.
  2. **Official path is a reviewed vendor form.** The Gartner Digital Markets
     get-listed flow (now at https://app.g2digitalmarkets.com/get-listed/start
     after a live redirect) requires email verification + editorial review —
     a human account action that stays with the account owner. No
     product-creation API, no agent-credential submission path.
  3. **Direct access 403-walled.** Capterra homepage, search, peer profile,
     and listing-guidelines all return HTTP 403 from this VPS (bot wall,
     re-verified 2026-08-15), so agent-side verification rests on Wayback/CDX
     and the dated scout checks.
  4. **No money blocked, but no spend authorization either.** No listing fee
     surfaced in official-path evidence; optional sponsored placement stays
     deferred to Nish. `agent-state/authorizations/` holds only the
     sol-xhigh worker grant (expired 2026-08-14).

## Live re-verification 2026-08-15 (credential-free)

- Wayback CDX no-duplicate: zero captures for `capterra.com/p/*aiconverter*`
  and `capterra.com/p/*ai-converter*`; `capterra.com/p/10048907*` also has no
  archive (the peer's evidence is the scout's 2026-08-09 live check). The
  venue hosts the exact category via the live peer profile
  https://www.capterra.com/p/10048907/Bank-Statement-Converter/ — only this
  product's listing is missing.
- Official path live: https://digitalmarkets.gartner.com/get-listed/start →
  HTTP 200 → redirects to https://app.g2digitalmarkets.com/get-listed/start
  (title "G2 Digital Markets"). The `claim-bx` claim flow is live too
  (archived captures run through 2026-08-07).
- Listing guidelines: https://web.archive.org/web/2026/https://www.capterra.com/legal/listing-guidelines/
  → HTTP 200 (direct access from VPS: HTTP 403).
- Direct VPS access: https://www.capterra.com/, /search/?q=aiconverter,
  /p/10048907/Bank-Statement-Converter/, /legal/listing-guidelines/ — all
  HTTP 403 (bot wall, unchanged).
- Kit reference pages all live HTTP 200: `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`;
  `/pricing/` and `/receipt-to-csv/` still 404 (unchanged; the kit claims
  none of those routes).

## Why the item cannot be closed from a lane (re-verified 2026-08-15)

1. `venue-policy.json` allowlist is EMPTY and capterra.com is
   `automation_disposition: unknown` → `venue-claim claim` exits 4, blocking
   ALL browser work (including account creation, per the contract's "NO
   browser work" rule).
2. The official get-listed flow is a reviewed vendor form with email
   verification + editorial review — a human account action that stays with
   Nish. No product-creation API exists.
3. The only override is a root change to the policy allowlist (or Nish doing
   the submission himself with the prepared kit).

## Checks on this lane

- Live HTTP/CDX checks (2026-08-15): Wayback CDX no-duplicate queries,
  403-wall probes for four Capterra URLs, Gartner get-listed/start + claim-bx
  redirects, archived listing-guidelines, and the six aiconverter.app kit
  reference pages — all as recorded above.
- No product code changed; docs only (`ops/launch-venues.md` Capterra section
  added/re-recorded, this report).
