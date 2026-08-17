# Lane 1 evidence — 2026-08-17: Toolbit.ai listing + paid/verified decision (packet item c9b3592b7b, re-dispatch)

**Verdict: NOT EXECUTED — the Toolbit.ai venue re-verified live 2026-08-17 and
the standing decision in `ops/launch-venues.md` still binds. The free
community listing was not submitted, for the same reason as the prior
attempts (2026-08-12, 2026-08-14): the fleet venue policy ledger
(`agent-state/growth-loop/venue-policy.json`, updated 2026-08-08) has no
toolbit.ai entry — `automation_disposition: unknown`, allowlist EMPTY — so
`venue-claim claim` exits 4 and the agent must not drive the browser
submission. The free flow is also a human account action (sign-in wall at
`/submit/tool?plan=free`, with Google and GitHub OAuth in 2026-08-17) whose
verification step (embedding the Launch Badge) is account-gated too, and the
ToS still prohibits automated access (clause 0.2 in the rendered HTML —
"Use any robot, spider, or other automatic device, process, or means to
access Service for any purpose, including monitoring or copying any of the
material on Service" — same class of language as Product Hunt's
prohibition). The paid/verified decision line (free plan first; $29 Launch
Tool deferred) stands as the record the packet asked for. No venue policy
change occurred since 2026-08-14.**

## Live re-verification 2026-08-17 (all credential-free, plain HTTPS GETs; toolbit.ai apex now 301s to www.)

toolbit.ai apex now redirects every path to `https://www.toolbit.ai/...` (HTTP
301, `server: cloudflare`); the `www.` host serves curl without a Cloudflare
challenge.

- No duplicate: site search `q=aiconverter`
  (https://www.toolbit.ai/search?q=aiconverter, HTTP 200, `<title>aiconverter
  - AI Tools Search</title>`) returns only unrelated tools and zero
  `aiconverter.app` mentions in the results (the only `aiconverter`
  strings in the served HTML are the query echo itself — none are a
  listing).
  https://www.toolbit.ai/ai-tool/ai-converter still serves a soft-404 page
  (HTTP 200 shell, `<title>Page Not Found - 404 Error | Toolbit.ai</title>`).
- Exact-category competitors still live, HTTP 200:
  StatementSheet (https://www.toolbit.ai/ai-tool/statementsheet,
  `<title>StatementSheet: Reviews, Features, Pricing, Alternatives</title>`)
  and Rocket Statements
  (https://www.toolbit.ai/ai-tool/rocketstatements, `<title>Rocket
  Statements: Reviews, Features, Alternatives</title>`). The venue still
  hosts the category; only this product's listing is missing.
- Submit page live, HTTP 200: https://www.toolbit.ai/submit (`<title>Submit
  Center | Toolbit</title>`) — "Instant Review" / "Flexible Options Paid &
  Free Plans" / "Free Plans" still advertised alongside the paid **Launch
  Tool $29 / One-time** plan ("Get your AI tool listed within 24 Hours with
  a blue verified badge", "Listed Within 24 Hours", "Blue Verified Badge",
  "Sidebar Featured (1 Day)", "Permanent Directory Listing", "One Social
  Media (X) Post"). **Update Tool $19 / One-time** also listed (refresh
  screenshots / pricing / etc.). The free community listing still requires
  Launch Badge embedding as its light-verification step.
- `/submit/tool?plan=free` (HTTP 200, final URL
  `https://www.toolbit.ai/login?redirect=%2Fsubmit%2Ftool`) now serves the
  sign-in wall (`<title>Sign In - Toolbit.ai</title>`) with **Google and
  GitHub** OAuth providers rendered in the page (prior record only
  mentioned email); still account-gated, still a human account action.
- `/launch-badge` still 404 — the badge snippet stays account-gated.
- ToS (https://www.toolbit.ai/terms-and-conditions, HTTP 200, `<title>Terms
  and Conditions - Toolbit.ai</title>`): the prohibited-uses list (clause
  0.2 in the rendered HTML) still says "Use any robot, spider, or other
  automatic device, process, or means to access Service for any purpose,
  including monitoring or copying any of the material on Service" — same
  class of language as Product Hunt's prohibition; flag for the venue
  research desk (the guard stays exit-4 either way).
- Kit reference pages all live HTTP 200 (2026-08-17): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`;
  `/pricing/` and `/receipt-to-csv/` still 404 (unchanged; the kit claims
  none of those routes).
- Policy ledger unchanged (re-read 2026-08-17): `venue-policy.json` updated
  2026-08-08; allowlist EMPTY; `reviewed_venues` holds only producthunt.com
  (prohibited), g2.com, capterra.com, getapp.com, alternativeto.net,
  startupsubmit.app (all `unknown`) — toolbit.ai is in neither list.
- `agent-state/authorizations/` holds only
  `sol-xhigh-worker-grant-20260811.json` — no toolbit.ai spend
  authorization exists.

## Decision (dated 2026-08-10, re-verified 2026-08-11, 2026-08-14 and 2026-08-17)

- **Toolbit.ai: SUBMIT — free community listing first ("Launch Tool $0 /
  Forever"), manual by Nish. The paid Launch Tool $29 / One-time is recorded
  and deferred to Nish's spend call.** The free listing's "verified" step —
  embedding Toolbit's Launch Badge snippet on aiconverter.app — is a
  follow-up owner action that needs a tiny deploy once Nish has the snippet
  from the submission flow (the snippet is account-gated and `/launch-badge`
  still 404). Kit copy-paste ready in `ops/launch-venues.md` (Toolbit.ai
  section). Lane attempt 2026-08-17: NOT EXECUTED (policy guard exit 4; no
  policy or authorization change since 2026-08-14).

## Why the item cannot be closed from a lane (re-verified 2026-08-17)

1. `venue-policy.json` allowlist is EMPTY and toolbit.ai is not in
   `reviewed_venues` either — `automation_disposition: unknown`. Per the
   venue-claim contract, exit 4 blocks ALL browser work — no agent-driven
   submission on this venue.
2. The free flow is a human account action: `/submit/tool?plan=free` renders
   the sign-in wall (Google or GitHub OAuth in 2026-08-17), and the free
   listing's verification step (embedding the Launch Badge) is account-gated
   too; the ToS prohibits automated access (clause 0.2 — same class of
   language as Product Hunt's prohibition — flag for the venue research
   desk).
3. The paid Launch Tool $29 / One-time is a spend decision only Nish can
   make; `agent-state/authorizations/` holds only
   `sol-xhigh-worker-grant-20260811.json`, no toolbit.ai entry.
4. The `venue-claim` binary is not installed in the lane environment, but
   the policy JSON is the authoritative guard and is unchanged; this record
   is the honest NOT-EXECUTED lane outcome the packet requires.

## Checks on this lane

- Live HTTPS checks for Toolbit.ai search (no-duplicate), submit center,
  free-plan sign-in wall (with Google + GitHub OAuth), ToS clause 0.2,
  competitors, badge snippet route, and the aiconverter.app kit reference
  pages (2026-08-17) — all as recorded above.
- No code changed; docs only (`ops/launch-venues.md` Toolbit.ai section
  updated with this run's re-verification, this report).
