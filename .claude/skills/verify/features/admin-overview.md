# Admin overview

The admin overview is the owner's page for failures, refunds due and funnel numbers. It answers only with the admin credential. A stranger gets 401.

## Sub-features

- `admin-auth` refuses a request without the admin credential (`functions/lib/admin-auth.js`).
- `admin-overview` returns the funnel, failures and refunds due (`functions/api/admin/overview.js`).
- `admin-drills` are the owner's checkout, refund and failover drills under `functions/api/admin/`.

## How to get to it (user POV)

- Only the owner reaches it, with `npm run monitor:live` or a request that carries the admin credential.

## Driving it with curl and node --test

Preconditions:

- No admin credential is needed for the stranger check.

- **Stranger is refused (live).** Run `curl -s -o /dev/null -w '%{http_code}\n' https://aiconverter.app/api/admin/overview`. It prints `401`. `npm run readiness:live` checks the same thing.
- **Overview shape.** Run `node --test tests/admin-funnel-overview.test.mjs tests/auth-cookie.test.mjs`. Both end `# fail 0`.
- **Owner view.** `npm run monitor:live` needs the admin credential. An agent reports it as not run.

## Gotchas

- A 200 from `127.0.0.1:4180/api/admin/overview` is the SPA page, not the admin page.
- Never paste the admin response into a public PR. It carries customer job data.
