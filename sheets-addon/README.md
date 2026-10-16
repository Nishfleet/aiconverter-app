# AI Converter: PDF to Sheets (Google Sheets add-on)

An editor add-on for Google Sheets. It adds **Extensions → AI Converter → Import PDF**, which opens a sidebar where the user:

1. picks what they are importing (bank statement, table, receipt or invoice) and a PDF/image,
2. sees the free preview (and can insert those preview rows),
3. clicks **Unlock all rows**, which opens the normal Dodo checkout in a new tab,
4. after paying, clicks **I've paid: import all rows**, which writes every row into a new tab.

## How it talks to aiconverter.app

All calls go from Apps Script (`UrlFetchApp`) to the existing APIs, which return JSON:

| Step | Endpoint | Notes |
| --- | --- | --- |
| Preview | `POST /api/convert` | multipart upload, `outputFormat=csv` |
| Checkout | `POST /api/checkout` | body `client: "sheets-addon"` sends the buyer back to `/google-sheets-pdf-import/` |
| Full run | `POST /api/finalize` | needs `paid_at`, which the Dodo webhook sets |
| Rows | `POST /api/result-rows` | bank, table (`screenshot`), receipt and invoice CSV, up to 5,000 rows |

Every request carries `X-AIConverter-Client: sheets-addon` and `Authorization: Bearer <ScriptApp.getIdentityToken()>`.
On `/api/convert`, the server verifies that Google ID token (`functions/lib/google-identity.js`). The add-on cannot run
the browser Turnstile check, and all add-on traffic comes from Google's shared IPs. So upload rate limits and preview
limits are keyed to the verified Google account instead of the IP. The add-on path stays **off** until
`GOOGLE_SHEETS_ADDON_CLIENT_IDS` is set on the Pages project.

Job tokens are kept in the user's Apps Script `UserProperties`, so a buyer can come back after checkout.

## Publishing (account steps, done by the owner)

1. **Apps Script project.** At https://script.google.com create a standalone project named "AI Converter: PDF to Sheets".
   Turn on "Show appsscript.json" in Project Settings, then paste in `appsscript.json`, `Code.gs` and `Sidebar.html`.
2. **Google Cloud project.** In Project Settings, switch the script to a standard Google Cloud project you own. On the
   OAuth consent screen, set the app as External, with homepage `https://aiconverter.app/google-sheets-pdf-import/`,
   privacy `https://aiconverter.app/privacy/` and terms `https://aiconverter.app/terms/`.
3. **Turn the server path on.** Copy that Cloud project's OAuth client ID (the identity token's audience) and set it on
   the Cloudflare Pages project `aiconverter` as the variable `GOOGLE_SHEETS_ADDON_CLIENT_IDS`. To allow several IDs,
   separate them with commas. Then redeploy.
4. **Test.** In Apps Script, use Deploy → Test deployments → Editor add-on on a test spreadsheet, and run one real
   statement through preview, checkout, webhook and import. Also try one file near the 35 MB add-on limit to confirm Apps Script accepts the upload.
5. **List it.** In the Cloud project, enable the Google Workspace Marketplace SDK, fill in the store listing (Sheets
   only, the icons, screenshots and the URLs above), create a versioned deployment, and submit it for OAuth
   verification and Marketplace review.
