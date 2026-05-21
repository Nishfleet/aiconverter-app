# Direct Integration Gates

AI Converter can offer file-based prep today: CSV presets, Google Sheets-ready CSV, QIF, OFX, and QBO downloads when the selected output is supported.

Direct app connections are not live. Do not claim Google Sheets sync, Google Drive storage, official QuickBooks integration, Xero connection, direct bank feeds, guaranteed import, reconciliation, categorization, or accounting/tax advice until the gates below are built and verified.

## Google Sheets / Drive

- OAuth consent screen and scopes are documented before implementation.
- Access tokens are stored server-side only, encrypted or provider-managed.
- Users can revoke access and delete stored tokens.
- Export writes are logged with job ID, destination spreadsheet ID, timestamp, and user-visible receipt.
- Privacy policy names the storage and deletion behavior.
- A failed write does not consume or corrupt the downloadable CSV path.

## QuickBooks / Xero

- OAuth scopes are minimal and documented.
- Sandbox import proof exists for the exact transaction format being sent.
- Every write produces a user-visible receipt and server audit log.
- Rollback or correction guidance exists before any write path is public.
- Duplicate prevention is implemented and tested.
- Support can identify job ID, external app, write status, and error reason without seeing source files.
- Public copy separates file prep from direct integration until production proof exists.

## Release Rule

Until these gates pass, public copy must say "CSV prep", "Sheets-ready CSV", "QIF/OFX/QBO download", or "review before import" rather than "connect", "sync", "direct integration", "bank feed", or "guaranteed import".
