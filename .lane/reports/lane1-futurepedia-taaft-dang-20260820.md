# Lane 1 report — Futurepedia + TAAFT + Dang.ai (re-dispatch 2026-08-20)

Packet item 7967b43c89: "List the product on Futurepedia (free submit-tool
path) and record submit-or-decline decisions for TAAFT and Dang."

Branch: `lane1/futurepedia-taaft-dang-20260820`

## Outcome

NOT EXECUTED (all three venues), with dated 2026-08-20 submit-or-decline
decisions recorded in `ops/launch-venues.md`. This is the fourth attempt of
this packet (2026-08-11, 2026-08-14, 2026-08-17, 2026-08-20); all prior
findings re-verified live and unchanged.

| Venue | Decision (2026-08-20) | Why |
| --- | --- | --- |
| Futurepedia | DECLINE | Free submit-tool path does **not** exist. Submit page FAQ verbatim: "We are no longer offering free submissions. It's very important to us to maintain the quality of our directory". Only options: Basic Listing $247 (Sold Out), Verified Listing $497 (one-time), Enterprise custom. No duplicate (`/tool/aiconverter` 404). |
| TAAFT (theresanaiforthat.com) | DECLINE | Paid-only launch ($49 Website only / $347 Everything you need). Free path is a monthly X-thread lottery (verbatim FAQ: "We run a thread on X once a month... We choose one tool from each thread") — not a listing route an agent can drive. `venue-claim claim` blocks. |
| Dang.ai | DECLINE | No public free path. Submission/pricing behind email-magic-link account gate ("Sign in to Dang.ai" / "Email me a secure link"). Sitemap now 6,851 tool URLs, still zero aiconverter hits. `venue-claim claim` blocks. |

All three venues remain `automation_disposition: unknown` in
`agent-state/growth-loop/venue-policy.json` (mtime still 2026-08-08,
allowlist still empty), so no agent-driven browser submission is permitted;
`venue-claim claim` exits with an ALLOWLIST/POLICY BLOCK error for each. The
`venue-claim` binary IS installed at `/home/nish/.local/bin/venue-claim` on
this VPS and the guard result is unchanged.

## Live re-verification evidence (2026-08-20)

- Futurepedia `/submit-tool` — HTTP 200; tiers unchanged (Basic $247 Sold
  Out, Verified $497 one-time); FAQ answer "no longer offering free
  submissions" confirmed in page HTML.
- Futurepedia `/tool/aiconverter` — HTTP 404 (no duplicate).
- TAAFT `/launch/` — HTTP 200; $49/$347 cards, Stripe, "$300 PPC bonus",
  prepaid-code option (Nish-held), free FAQ = monthly X-thread one-tool
  contest (verbatim, incl. linked X thread).
- TAAFT search + sitemap — Cloudflare-challenged from this VPS (HTTP 403
  "Just a moment..."), consistent with TAAFT ToS §8-A (EUR 100k automated
  extraction damages). No change to the 2026-08-14 Camoufox-verified
  no-duplicate finding.
- Dang.ai `/login?next=%2Fpricing` — gate verbatim unchanged; `/pricing`
  redirects to login.
- Dang.ai `/sitemap.xml` — HTTP 200, 6,851 URLs, zero aiconverter hits.
- `venue-claim claim` guard re-run for futurepedia.io, theresanaiforthat.com,
  dang.ai — ALLOWLIST/POLICY BLOCK (venue unknown, not allowlisted, not
  reviewed) for all three.
- Kit reference pages (`/`, `/llms.txt`, `/bank-statement-pdf-to-csv/`,
  `/sample-csv/`, `/trust/`, `/formats/`) all HTTP 200; `/pricing/` and
  `/receipt-to-csv/` still 404 (kit claims none of those routes).

## Files changed

- `ops/launch-venues.md` — header re-verify line (adds 2026-08-20) + three
  `### Fleet lane attempt 2026-08-20` records (Futurepedia, TAAFT, Dang.ai).
- `.lane/reports/lane1-futurepedia-taaft-dang-20260820.md` — this report.

## Notes

- `.lane/report.md` (shared lane file) left untouched on purpose.
- No code, config, or production changes; docs-only commit.
- Next action for Nish (unchanged from prior records): Futurepedia Verified
  $497 / Basic $247 when available; TAAFT $49 or $347 launch; Dang.ai sign-in
  via email magic link to review options behind the gate.
