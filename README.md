# AI Converter

AI Converter is a Cloudflare Pages app for preview-first AI conversion and common file conversion.

Current production AI module:
- Bank statement PDF to CSV.

Current beta modules:
- Receipt image/PDF to expense CSV.
- Screenshot/table image/PDF to spreadsheet CSV.
- Invoice/bill image/PDF to CSV or JSON.
- Audio file to TXT or JSON transcript.
- Rich document/image to Markdown.
- Screenshot/image to HTML, with a free starter preview and paid Workers AI vision export when configured.
- Universal file conversion through CloudConvert, with Convertio backup when `CONVERTIO_API_KEY` is configured.

Current image modules:
- PNG/JPG/WEBP to PNG/JPG/WEBP.
- PNG/JPG/WEBP to posterized SVG.

## Live Infrastructure

- Public domain: `https://aiconverter.app`
- Authoritative DNS: Porkbun nameservers, with apex ALIAS and `www` CNAME pointed at `aiconverter-wnm.pages.dev`
- Cloudflare Pages project: `aiconverter`
- D1 database: `aiconverter`
- R2 bucket: `aiconverter-private`
- Payment provider: Dodo Payments
- OCR and document extraction fallback: Mistral OCR
- Speech recognition and Markdown conversion: Cloudflare Workers AI
- Universal provider conversion: CloudConvert
- Universal provider backup: Convertio

## Automation Off-Switches

Every workflow in `.github/workflows/`, what fires it, and how to switch it
off. Deleting the file switches the workflow off, because GitHub runs only
what that directory holds. Removing one trigger is the smaller step when the
rest of the file must stay for a manual run.

| Workflow | Fires on | Off-switch |
| --- | --- | --- |
| `ci.yml` | Every pull request, every push to `main` | Delete the file. It reports four of the six required checks (`Build`, `Pricing check`, `Unit tests`, `actionlint`), so clear those four under Settings → Rules → Rulesets first, or every pull request waits on a check that never reports. |
| `secret-scan.yml` | Every pull request, every push to `main` and `master`, manual | Delete the file. It reports `Gitleaks` and `semgrep`; clear both under Settings → Rules → Rulesets first. |
| `deploy.yml` | Push to `main`, manual | Delete the file to stop deploys. Delete the `push:` trigger to keep the manual run and stop deploy-on-merge. Do not turn on the Cloudflare Pages Git integration (Pages → Settings → Builds & deploys) at the same time as this workflow: two deploy paths race each other, and this workflow is the one that runs the pricing check, the tests, the build and the live-site verification. |
| `lighthouse.yml` | After a successful production deploy, Mondays at 04:41 UTC, manual | Delete the file. Delete the `workflow_run:` and `schedule:` triggers to keep the manual audit only. |
| `agent-dispatch.yml` | Issue labels and comments, pull-request events, a completed CI run, every 6 hours, manual | Delete the file to stop the fleet from starting worker runs on this repo. Delete the `schedule:` block to keep event-driven dispatch and drop the 6-hour sweep. |
| `dependabot-automerge.yml` | Every pull-request event | Delete the file to stop Dependabot pull requests from being armed for auto-merge. Delete the `pull_request_target:` trigger to keep the file in the tree without arming anything. Major version updates never arm either way, so only patch and minor bumps merge on their own. |

The six required checks and the job that reports each one are listed in
[docs/ops/ci.md](docs/ops/ci.md).

### Version tags

No release tag exists yet, and `package.json` carries the version (`0.1.0`).
A tag marks a commit as a release head; it does not by itself build, deploy or
publish anything. When a release is cut, tag the commit that ships it and push
the tag:

```bash
git tag -a v0.1.0 -m "v0.1.0" <commit-sha>
git push origin v0.1.0
```

## Local Commands

```bash
npm ci
npm run check:pricing
node --test tests/*.test.mjs
npm run corpus:private
npm run stress:converters
npm run build
npm run monitor:live
npm run stress:live
npm run stress:checkout
npm run readiness:live
```

Database notes: [docs/ops/database.md](docs/ops/database.md)
DNS notes: [docs/ops/dns.md](docs/ops/dns.md)
Monitoring notes: [docs/ops/monitoring.md](docs/ops/monitoring.md)
Private corpus notes: [docs/ops/private-corpus.md](docs/ops/private-corpus.md)
Launch venue notes: [docs/ops/launch-venues.md](docs/ops/launch-venues.md)
Wedge evidence notes: [docs/ops/serp-wedge-evidence.md](docs/ops/serp-wedge-evidence.md)

Deploy:

```bash
wrangler pages deploy dist --project-name aiconverter --branch main
```

Use the safe-deploy wrapper on Nish's machine before live commands.

## Product Truth

- Preview is free.
- Password-protected PDFs are supported when the PDF password is supplied on upload.
- Full AI extraction unlock is paid.
- Dodo checkout creation, signed webhook validation, paid finalize/download code paths, admin refund drills, and failed-payment handling are implemented and covered by automated checks.
- One successful real-card drill through checkout, webhook, paid finalize, download, redo, and cash refund still needs operator proof before scaling paid traffic. The 2026-05-18 drill's ₹299 refund stayed blocked on Dodo wallet funds (five failed attempts) and was written off by explicit operator decision on 2026-08-10 — see `docs/ops/refund-writeoffs.md`.
- Source files are private and short-retention.
- No human file review queue.
- Multi-file preview is implemented. Batch checkout unlocks queued previews in one payment and downloads completed exports as one ZIP.
- Provider-backed universal conversion is implemented and activates when the production `CLOUDCONVERT_API_KEY` or `CONVERTIO_API_KEY` secret is configured.
- CloudConvert is the primary universal provider route when the production `CLOUDCONVERT_API_KEY` secret is configured.
- Convertio backup conversion is implemented when the production `CONVERTIO_API_KEY` secret is configured.
- CloudConvert daily cap/credit reserve and Convertio daily cap guardrails are enforced before new provider jobs start.
- Pixel-perfect screenshot-to-code is not live.
- Do not claim universal support for every bank, receipt, invoice, screenshot, document, audio file, image, file type, or compliance regime.
