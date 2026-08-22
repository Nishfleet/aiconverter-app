# Lane 1 evidence — 2026-08-23: Microlaunch listing via + New Launch (packet item ed8ccbdb9d, re-dispatch #5)

**Verdict: NOT EXECUTED — blockers unchanged since 2026-08-20.** The Microlaunch venue
re-verified live 2026-08-23 and the standing decision in `ops/launch-venues.md` (dated
2026-08-11) still binds. The regular (free) launch was not submitted, for the same reasons as
every prior attempt: the fleet venue policy ledger
(`agent-state/growth-loop/venue-policy.json`, updated 2026-08-08, re-read 2026-08-23) has no
microlaunch.net entry — allowlist still empty — so the agent must not drive a browser
submission. Submission additionally requires a human account action (the sign-in gate is Google
/ 𝕏 OAuth only), which stays with Nish per the 2026-08-11 decision; the optional Pro Launch
$39 upgrade is a spend decision only Nish can make (no spend authorization exists in
`agent-state/authorizations/` — only the sol-xhigh worker grant).

## Live re-verification 2026-08-23 (all credential-free curl)

Venue liveness:

```
curl -sS -o /dev/null -w '%{http_code}\n' https://microlaunch.net/
200

curl -sSL -o /dev/null -w '%{http_code} %{url_effective}\n' https://microlaunch.net/submit
200 https://microlaunch.net/premium#pricing

curl -sS -o /dev/null -w '%{http_code}\n' https://microlaunch.net/premium
200

curl -sS -o /dev/null -w '%{http_code}\n' https://microlaunch.net/terms
200
```

Exact-category peers:

```
curl -sS -o /dev/null -w '%{http_code}\n' https://microlaunch.net/p/bankstatementconverter
200

curl -sS -o /dev/null -w '%{http_code}\n' https://microlaunch.net/p/bankformats
200
```

Duplicate check — slug probes:

```
curl -sS -o /dev/null -w "%{http_code} aiconverter\n" "https://microlaunch.net/p/aiconverter"
500 aiconverter

curl -sS -o /dev/null -w "%{http_code} ai-converter\n" "https://microlaunch.net/p/ai-converter"
500 ai-converter

curl -sS -o /dev/null -w "%{http_code} aiconverter-app\n" "https://microlaunch.net/p/aiconverter-app"
500 aiconverter-app

curl -sS -o /dev/null -w "%{http_code} ai-converter-app\n" "https://microlaunch.net/p/ai-converter-app"
500 ai-converter-app

curl -sS -o /dev/null -w "%{http_code} AI-Converter\n" "https://microlaunch.net/p/AI-Converter"
500 AI-Converter

curl -sS -o /dev/null -w "%{http_code} aiconverter.app\n" "https://microlaunch.net/p/aiconverter.app"
500 aiconverter.app
```

Duplicate check — API scan:

```
curl -sS --max-time 60 https://api.microlaunch.net/api/launches | grep -Eci 'ai.?converter'
0

python3 -c 'import json;d=json.load(open("/tmp/microlaunch-api.json"))["data"];print(len(d.get("launches",[])),len(d.get("products",[])))'
250 250
```

ToS automation-string re-check:

```
curl -sS https://microlaunch.net/terms | grep -Eci 'robot|spider|crawl|scrap|automated|bot'
0
```

Kit reference pages:

```
curl -sS -o /dev/null -w "%{http_code} /\n" --max-time 30 "https://aiconverter.app/"
200 /

curl -sS -o /dev/null -w "%{http_code} /llms.txt\n" --max-time 30 "https://aiconverter.app/llms.txt"
200 /llms.txt

curl -sS -o /dev/null -w "%{http_code} /bank-statement-pdf-to-csv/\n" --max-time 30 "https://aiconverter.app/bank-statement-pdf-to-csv/"
200 /bank-statement-pdf-to-csv/

curl -sS -o /dev/null -w "%{http_code} /sample-csv/\n" --max-time 30 "https://aiconverter.app/sample-csv/"
200 /sample-csv/

curl -sS -o /dev/null -w "%{http_code} /trust/\n" --max-time 30 "https://aiconverter.app/trust/"
200 /trust/

curl -sS -o /dev/null -w "%{http_code} /formats/\n" --max-time 30 "https://aiconverter.app/formats/"
200 /formats/

curl -sS -o /dev/null -w "%{http_code} /pricing/\n" --max-time 30 "https://aiconverter.app/pricing/"
200 /pricing/

curl -sS -o /dev/null -w "%{http_code} /receipt-to-csv/\n" --max-time 30 "https://aiconverter.app/receipt-to-csv/"
200 /receipt-to-csv/
```

Blocker-state checks (file reads):

```
python3 -c 'import json;d=json.load(open("/home/nish/workspaces/agent-state/growth-loop/venue-policy.json"));print(d["updated"], d["allowlist"], "microlaunch" in json.dumps(d).lower())'
2026-08-08 {} False

ls /home/nish/workspaces/agent-state/authorizations/
sol-xhigh-worker-grant-20260811.json
```

Premium page body notes (supplemental grep on served HTML):

```
curl -sS https://microlaunch.net/premium | grep -ci 'regular launch'
1

curl -sS https://microlaunch.net/premium | grep -ci 'pro launch'
1

curl -sS https://microlaunch.net/premium | grep -ci 'launch20'
1

curl -sS https://microlaunch.net/premium | grep -ci 'expert feedback'
1

curl -sS https://microlaunch.net/premium | grep -c '\$39'
0
```

ToS length: 4836 bytes (via `curl -sS https://microlaunch.net/terms | wc -c`).

## Blocking factors (all re-confirmed live 2026-08-23)

1. **Venue policy ledger blocks agent submission.** `agent-state/growth-loop/venue-policy.json`
   (updated 2026-08-08, re-read 2026-08-23) has no microlaunch.net entry — allowlist still
   empty (`2026-08-08 {} False` from live read) — so the agent must not drive a browser
   submission per the 2026-08-11 decision in `ops/launch-venues.md`.
2. **OAuth sign-in gate (human account action).** The sign-in flow offers Google / 𝕏 only; `/submit`
   redirects to `https://microlaunch.net/premium#pricing` (HTTP 200), gating submission behind
   account creation. Nish must sign in and submit the Regular launch using the kit on file.
3. **Paid upgrade decision stays with Nish.** The Pro Launch offer (LAUNCH20 code visible on
   `/premium`; literal `$39` absent in served HTML) is an optional spend call; `agent-state/authorizations/`
   holds only `sol-xhigh-worker-grant-20260811.json`.

## Checks on this lane

- Live HTTP checks for Microlaunch homepage, `/submit` redirect target, premium pricing page,
  both exact-category peers, the launches API duplicate scan (250 + 250 records, zero
  ai-converter hits), slug probes, ToS, and the aiconverter.app kit reference pages — all as
  recorded above.
- Docs only: `ops/launch-venues.md` Microlaunch section appended with the 2026-08-23
  re-verification, this report.

## What would change the verdict

- The venue research desk adds `microlaunch.net` to
  `agent-state/growth-loop/venue-policy.json#allowlist` (or marks automation disposition
  review-complete) **and** an agent-usable endpoint exists; OR
- Nish completes the OAuth sign-in flow and submits the Regular launch with the kit already on
  file in `ops/launch-venues.md`, then the dated "Decision" line flips to SUBMITTED with the
  live product URL.

Until either happens, every re-dispatch of this packet produces the same honest NOT-EXECUTED
outcome and a fresh dated re-verification.
