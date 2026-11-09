# Google Sheets add-on

The add-on lets a user convert a file from inside Google Sheets. It sends the user's Google ID token with each upload, and the server checks that token before it accepts the file. Uploads from the add-on skip Turnstile and are rate-limited per Google account.

## Sub-features

- `sheets-identity` verifies the Google ID token (`functions/lib/google-identity.js`).
- `sheets-upload` accepts an add-on upload on `/api/convert` with the `X-AIConverter-Client: sheets-addon` header.
- `sheets-limits` caps uploads per Google account and across all accounts per hour.
- `sheets-manifest` keeps the add-on's OAuth scopes narrow (`sheets-addon/appsscript.json`, `sheets-addon/Code.gs`).

## How to get to it (user POV)

- In Google Sheets, open Extensions, then AI Converter, then pick a file.
- The landing page `/google-sheets-pdf-import/` explains it.

## Driving it with node --test

Preconditions:

- `npm ci` has run.
- The add-on is enabled only where `GOOGLE_SHEETS_ADDON_CLIENT_IDS` is set. Without it, `/api/convert` answers 503 "not enabled" to add-on requests.

- **Identity and limits.** Run `node --test tests/sheets-addon.test.mjs`. It ends `# fail 0`. It signs real RS256 tokens with a test key and covers wrong audience, expired, wrong issuer, unverified email, wrong key, unknown key id, key rotation, a Google certs outage and a certs 500 on refresh followed by a successful sign-in.
- **Landing page.** With the local preview up, run `curl -fsS http://127.0.0.1:4180/google-sheets-pdf-import/ -o /tmp/verify-aiconverter/sheets.html` and require HTTP 200 and the text `Google Sheets` in the body.

## Gotchas

- Real Google tokens cannot be minted by an agent. The unit test is the identity proof, and a live add-on run is owner-only.
- The key-rotation and outage tests move time with node:test mock timers (`t.mock.timers.enable({ apis: ["Date"] })` plus `tick`), not with a `now:` argument: jose's key cache in `functions/lib/google-identity.js` reads the real clock, so a test without mock timers cannot step past the ~30 s cooldown after a failed certs fetch or the ~10-minute key cache. Call `resetGoogleKeyCacheForTests()` before each such test, because the cache is module-wide.
