# Lane 1 evidence — AIAccountingApps.com listing (packet item f19a142713)

Date: 2026-08-21
Branch: `lane1/aiaccountingapps-listing-20260821`
Worktree: `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260821-164820`

## Verdict

**NOT EXECUTED — decision recorded, kit prepared.** The listing was not
submitted and no money was spent. The venue hosts the exact category
(Bank Statement Conversion, only 4 tools) with no aiconverter.app listing;
the dated decision line in `ops/launch-venues.md` records SUBMIT via the free
editorial route (manual by Nish), the €59 paid path deferred to Nish's spend
call, and agent-executed submission declined under the fleet venue policy.

## Item

"List the product on AIAccountingApps.com — exact-category directory (319
tools, 13 categories) with a dedicated Bank Statement Conversion category
(only 4 tools listed) and AI Converter is absent."

The item's own acceptance bar: "a truthful AIAccountingApps listing submitted
(paid €59 path) OR an explicit decline recorded with a dated reason
(zero-spend rule); OR Nish explores the 'write to the editor first' free path
... Acceptance is a public listing URL or a dated decision line." This run
delivers the dated decision line plus a copy-paste kit (including the draft
editor email for the free path).

## Why NOT EXECUTED

1. **Venue policy gate:** `agent-state/growth-loop/venue-policy.json`
   (re-read 2026-08-21; still `updated: 2026-08-08`) has no
   aiaccountingapps.com entry → `automation_disposition: unknown`, executable
   `allowlist` empty → per the `venue-claim` contract, `claim` exits 4
   (allowlist/policy block) and "A blocked exit means NO browser work." The
   `venue-claim` binary is not installed in the lane environment
   (`/home/nish/.local/bin/venue-claim: No such file or directory`), but the
   policy JSON is the authoritative guard and is unchanged.
2. **Money boundary:** the paid path is €59 one-off via Stripe — spend
   decisions are Nish-only (zero-spend rule). No spend authorization exists
   in `agent-state/authorizations/` (only the sol-xhigh worker grant,
   expired 2026-08-14).
3. **Human identity:** the free route is an email to
   hello@aiaccountingapps.com from Nish's identity — not an agent action.
   A draft email is included in the kit so his step is copy-paste.

## Live verification (2026-08-21, plain HTTP, credential-free)

All fetches with a desktop Chrome UA; every URL below returned HTTP 200
unless noted.

### Venue homepage — https://www.aiaccountingapps.com/

- Title: "AI Accounting Apps · 319 tools across 13 categories (2026)".
- Banner: "June 2026 edition · Independent. No pay-to-rank."
- Stats row: "Tools indexed 319 · Categories 13 · Featured 1 · Verified 5".
- Category list includes "04 Bank Statement Conversion 4 tools" (the
  smallest paid-relevant category on the index).
- FAQ: "Submission and listing are free of charge." (contradicts /submit —
  recorded honestly in the decision).
- Footer contact: hello@aiaccountingapps.com, @aiaccapps.

### Category page — https://www.aiaccountingapps.com/c/bank-statement-converters/

- Title: "4 Best Bank Statement Conversion Tools (2026)".
- Tool profile slugs present in the page: `/ai-bank-parser`, `/lido`,
  `/smart-clerk`, `/badbank-ai` — exactly the 4 competitors named in the
  packet (AI Bank Parser, Lido, Smart Clerk, Badbank AI).
- Zero occurrences of "aiconverter" or "AI Converter" anywhere in the page —
  no duplicate, listing missing.

### Submit page — https://www.aiaccountingapps.com/submit/

- Title: "List your AI accounting tool | AI Accounting Apps".
- "Get indexed in the directory accountants actually read. A clean profile
  in the 319-tool index. A do-follow link from a domain accountants already
  visit. A place in the category your buyers search by name."
- Pricing table: "Fee €59 one-off · Review time Within 24 hours · Backlink
  Do-follow ... Domain Rating sits at 30+ at the time of writing"; verified
  badge "5 of 319 listings carry it today".
- CTAs: "Pay and submit · €59" and "Or write to the editor first".
- Stripe checkout link present in page HTML:
  https://buy.stripe.com/28og0t78E9xMfRe5kl
- "How it runs": "01 Pay the €59 fee. A single Stripe checkout. No
  subscription. No upsell. 02 Send us your details. Email the URL, a
  one-paragraph description, your logo, and the category you belong in to
  hello@aiaccountingapps.com. Turnaround is one business day."
- Editor quote: "Paid does not buy ranking. It buys a verified mark and an
  honest profile."
- FAQ: "My team makes a bank statement conversion tool. How do we get
  listed? Write to the editor."

### Policy surface

- robots.txt (live): Cloudflare managed content-signals preamble
  (`User-agent: *` → `Content-Signal: search=yes,ai-train=no,use=reference`,
  `Allow: /`); explicit disallows only for specific AI crawlers (GPTBot,
  ClaudeBot, CCBot, Bytespider, etc.) and, for `User-agent: *`, only
  `/api/`, `/_next/`, `/ingest/`. **No blanket robot/spider prohibition** —
  positive evidence for the venue research desk; the guard stays exit-4
  until the ledger is reviewed.
- No ToS/terms page: `/terms`, `/tos`, `/privacy` all HTTP 404; `/about`
  307-redirects internally.

### Our side (kit truthfulness)

- Live HTTP 200 on 2026-08-21: `https://aiconverter.app/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
- Still 404: `/pricing/`, `/receipt-to-csv/` — claimed nowhere in the kit
  (consistent with the standing regression note in `ops/launch-venues.md`).

## Changes in this branch

- `ops/launch-venues.md`:
  - Header verification paragraph now covers AIAccountingApps.com (verified
    2026-08-21); venue count fifteen → sixteen; aiaccountingapps.com added
    to the unreviewed list; the €59 added to Nish-held spend decisions.
  - New entry in "Submission outcomes": AIAccountingApps.com —
    NEEDS_NISH_STEP (agent-executed submission declined).
  - New section `## AIAccountingApps.com`: dated decision (SUBMIT — free
    editorial route first, manual by Nish; €59 deferred; declined for
    agent-executed submission), copy-paste manual submission kit (name,
    website, category, description, features, pricing tag, canonical links,
    draft editor email, post-listing check), and the fleet lane attempt
    record for 2026-08-21.
- `.lane/reports/lane1-aiaccountingapps-listing-20260821.md`: this report.

No code changed; docs only. Claims published before editing:
`ops/launch-venues.md` (lane record `claims` field).

## Next action (human-owned)

Nish sends the draft editor email (free route first). If the editor points
back to the €59 fee, that is his explicit spend call. After either outcome,
update `ops/launch-venues.md` with the public URL (or the decline) and flip
the venue's status line to live.
