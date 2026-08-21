# Lane 1 — Password-protected PDF support (2026-08-21)

Sealed packet item: `eb589d28cd` — "Password-protected PDF support is a stated
market need that AI Converter does not address".

Branch: `lane1/pdf-password-support-20260821` (origin pushed, PR pending)
Worktree: `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260821-072532`

## Outcome

AI Converter now accepts password-protected PDFs through the upload form and
unlocks them through PDF.js when the password matches. When a PDF requires a
password and none is supplied, the API returns HTTP 400 with a clear
"password-protected" message and the UI shows the password field as required.
A wrong password surfaces a separate "incorrect password" error so users can
retry without changing the file.

## What ships

### Backend
- `functions/lib/extract.js`
  - `PdfPasswordRequiredError` and `PdfIncorrectPasswordError` exported
    with stable `code` strings (`pdf_password_required`, `pdf_incorrect_password`).
  - `openPdfDocument` helper centralizes password-aware document loading and
    surfaces the two error types.
  - `detectPdfPageCount` and `readPdfTextPages` accept `{ pdfPassword }`.
  - `extractWithNativePdf` and `extractWithMistralOcr` (plus Azure and
    Cloudflare AI fallbacks) thread the password through and surface a
    `pdf_incorrect_password` error when the OCR fallback receives an
    encrypted PDF it cannot decode.
  - `convertPdfToCsv` maps the new error codes into the standard result
    envelope so `convert.js` can render clear user-facing messages.
  - `sanitizePdfPassword` exported for reuse; trims to 256 chars and treats
    nullish as empty.
- `functions/api/convert.js`
  - Reads `pdfPassword` from the form data, sanitizes, passes to extract
    flow.
  - Returns HTTP 400 with `pdf_password_required` message at page-count
    detection time when no password was provided.
  - Records `pdf_password_required` / `pdf_incorrect_password` funnel
    events instead of generic `preview_failed` so we can measure impact.
  - Returns `errorCode` in the failed-preview payload so the UI can keep
    the password field visible and pre-fill nothing.

### Frontend
- `src/main.jsx`
  - Optional password field shown when the uploaded file is a PDF and the
    selected converter accepts PDFs.
  - The field hint states the password is decrypted in-request only and is
    never written to private storage.
  - When the API returns `pdf_password_required`, the field flips to a
    "password required" state and keeps the previous password so the user
    can correct and retry.
  - When the API returns `pdf_incorrect_password`, the same message is
    surfaced inline and tracked as its own error code.
- `src/styles.css` — minor styling for the password-required tag and the
  privacy hint.

### Tests
- `tests/pdf-password.test.mjs`
  - `sanitizePdfPassword` length/nullish handling.
  - Error class shape (code, boolean flags, user-facing messages).
  - `detectPdfPageCount` happy/missing/wrong paths.
  - `convertPdfToCsv` returns `pdf_password_required` / `pdf_incorrect_password`
    error codes.
  - `convert.js` HTTP 400 with password-required message via an in-memory
    env mock.
- `tests/pdf-password-mock-loader.mjs`
  - Register-only Node loader that swaps `unpdf.getDocumentProxy` for a
    password-aware mock, so the suite exercises the real extract/convert
    code paths without needing a real encrypted PDF fixture.

### Docs / copy
- `ARCHITECTURE.md` security controls section now documents password support.
- `README.md` product-truth bullet added.
- `functions/_middleware.js` and the public landing pages
  (`bank-statement-pdf-to-csv`, `convert-bank-statement-to-csv`,
  `pdf-bank-statement-to-xero-csv`, `scanned-bank-statement-to-excel`,
  `pricing`, `terms`) updated from "password-protected PDFs may fail" to
  "password-protected PDFs are supported when the PDF password is
  provided on upload".

## Evidence

- `node --test tests/*.test.mjs` → 229/229 passing.
- `node_modules/.bin/vite build` → built in 293 ms, no errors.
- Commits pushed to `origin/lane1/pdf-password-support-20260821`:
  1. `ec0eb0e` feat(pdf): accept PDF password and surface clear encryption errors
  2. `1e5c7b3` feat(ui): add optional PDF password input for protected uploads
  3. `f9ae2a2` test(pdf): cover password flow and update docs to match

## Privacy stance

- The password is decrypted in this request only.
- The password is never written to private R2, never logged, never stored in
  D1, and never returned in any preview or download response.
- The password is dropped from the closure as soon as the request returns.

## Known limitations (deliberate scope cuts)

- The OCR fallbacks (Mistral OCR, Azure Document Intelligence, Cloudflare
  Workers AI toMarkdown) receive the original encrypted bytes when they are
  invoked. They cannot decrypt the file themselves, so a password-protected
  PDF that needs OCR (rather than the built-in PDF.js text parser) will
  fail with `pdf_incorrect_password`. The primary conversion path
  (`native-pdf` parser) handles the most common case: text-based
  password-protected PDFs from banks.
- `pdfPassword` is intentionally not persisted to the job row, so the
  24-hour redo window only re-runs the existing extracted preview CSV, not
  a fresh extraction. If the user wants a fresh extraction after source
  retention expires, they re-upload with the password.

## Out of scope / not changed

- No DB migration: the password is request-scoped only.
- No changes to the payment, webhook, admin, or audit flows.
- No changes to the receipt, invoice, screenshot, audio, document, or
  universal file flows other than surfacing the new error code.
