import { withSecurityHeaders } from "./lib/http.js";

const markdown = `---
title: AI Converter - Useful file conversion
description: Convert bank statement PDFs, receipts, invoices, screenshots, documents, audio, common images, and provider-backed file formats into useful outputs with preview-first AI routes and local conversion.
---

# AI Converter

AI Converter converts sensitive files into useful CSV, JSON, Markdown, transcript, HTML, SVG, image, document, media, or archive outputs. Bank statements are the first live AI module. Receipts, invoices, screenshot tables, audio transcripts, document Markdown, and screenshot-to-HTML are beta AI modules. Common image-format and raster-to-SVG conversion is browser-local. Universal provider conversion activates when CloudConvert or the Convertio backup route is configured.

## Live and beta modules

Live:

- Direct browser upload.
- Built-in parser first for digital PDFs.
- Mistral OCR fallback for scanned or messy PDFs when configured.
- Free sample preview before payment.
- Full extraction and CSV download after payment.
- One automatic stronger redo for paid jobs.
- No email intake for bank statements.
- No human review queue.
- Source files are stored privately and deleted after failed extraction, completed redo, or the 24-hour source lifecycle.
- Low-confidence conversions fail closed with no charge.
- Free-preview reuse, payment reuse, and redo abuse are rate-limited.
- PNG/JPG/WEBP to PNG/JPG/WEBP conversion runs locally in the browser and does not upload the image.
- PNG/JPG/WEBP to SVG posterized conversion runs locally in the browser and does not upload the image.
- Universal provider conversion for documents, images, audio, video, and archives runs through CloudConvert first, with Convertio as a configured backup route. Long provider jobs run in the background and update automatically.

Beta:

- Receipt image or PDF to expense CSV with vendor, date, category, total, tax, payment method, and notes when safely detected.
- Invoice or bill image/PDF to CSV or JSON with invoice fields and line items when safely detected.
- Screenshot PNG, JPG, WEBP, or image PDF to spreadsheet CSV with table/header inference when safely detected.
- Audio transcript from MP3, WAV, M4A, AAC, OGG, or WEBM to TXT or JSON when Workers AI is configured.
- Document Markdown conversion for Cloudflare-supported rich document formats when Workers AI Markdown Conversion is configured.
- Screenshot to HTML provides a clean starter preview and uses Workers AI vision for paid image exports when configured. This does not claim pixel-perfect screenshot cloning.
- Beta modules use OCR and fail closed when confidence is too low.

## Popular conversion examples

The homepage ticker suggests common requests that fit the current product surface. Core examples include bank statement PDF to CSV, receipt image to expense CSV, invoice PDF to JSON, screenshot table to CSV, JPG to PNG, PNG to JPG, WEBP to PNG, audio to transcript, and document to Markdown. When universal provider conversion is configured, the homepage can truthfully say 200+ conversion options are available across the current accepted input formats and output choices, with more coming soon. Examples include PDF to Word, Word to PDF, PDF to JPG, HEIC to JPG, SVG to PNG, MP4 to MP3, MOV to MP4, GIF to MP4, WAV to MP3, XLSX to CSV, CSV to XLSX, docs/images/audio/video/archive categories, and many more provider-backed formats.

## Pricing

- Free preview: first rows before payment.
- Starter: $3 for 25 pages or images.
- Standard: $5 for 100 pages or images.
- Bulk: $9 for 500 pages or images.

## Upcoming modules

- AI-monitored email intake after the direct upload workflow is stable.
- Pixel-perfect image-to-code is not claimed. Universal provider conversion is available only when a provider route is configured and the route preview accepts the file.

## Security posture

The AI workflow is designed for private storage, 24-hour source retention, 7-day generated-file retention, random job tokens, no public object URLs, no emailed bank PDFs, and minimal job metadata. Browser-local image and SVG conversion does not create server-side files.

## Request access

Use the upload flow at https://aiconverter.app.

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AI Converter",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://aiconverter.app",
  "description": "AI Converter converts bank statement PDFs, receipts, invoices, screenshot tables, documents, audio, common images, and provider-backed file formats into useful outputs."
}
\`\`\`
`;

const aboutMarkdown = `---
title: About AI Converter
description: AI Converter is a private, preview-first converter for sensitive files, with bank statement PDF to CSV live first, beta AI routes, provider-backed conversion, local image tools, and short retention.
---

# About AI Converter

AI Converter turns source files into reviewable outputs without a human review queue. Upload directly, inspect a preview first, and unlock the full export only when the sample is useful.

It is built for short retention, private storage, and clear failure states.

## Live

- Bank statement PDF to CSV.
- Sample preview before payment.
- Paid full export and download.
- One stronger automatic redo for paid jobs.
- Browser-local image format and raster-to-SVG tools.

## Beta and provider-backed

Receipts, invoices, screenshot tables, audio transcripts, document Markdown, screenshot-to-HTML, and universal file conversion run through configured AI or conversion providers. If a route cannot produce a reliable preview or provider result, it fails closed instead of pretending.

## Privacy posture

Source files are stored privately for preview, unlock, and the redo window. Generated files expire after a short download window. Support requests should reference job IDs, not pasted bank, receipt, invoice, screenshot, or source-file data.

## Boundaries

AI Converter does not claim every bank, receipt, invoice, screenshot, audio file, document, image format, provider pair, certified compliance status, pixel-perfect image-to-code, or guaranteed accuracy. Review exports before important use.
`;

const bankStatementMarkdown = `---
title: Bank statement PDF to CSV
description: Convert a bank statement PDF to CSV with direct upload, free preview, paid unlock, and short source-file retention.
---

# Bank statement PDF to CSV

AI Converter turns bank statement PDFs into spreadsheet-ready CSV. Upload the PDF, check sample rows first, then unlock the full CSV only when the preview looks useful.

## Workflow

1. Upload a bank statement PDF.
2. Review sample rows before payment.
3. Unlock the full CSV if the preview is usable.
4. Download the generated CSV.

## Pricing

- Free preview.
- $3 for up to 25 pages.
- $5 for up to 100 pages.
- $9 for up to 500 pages.

## Limits

Files can fail when they are password-protected, corrupted, unusual, low quality, or too large. AI Converter currently accepts PDFs up to 50 MB and does not claim every bank format is supported.

No bank login is requested. The export should be reviewed before important use.
`;

const convertMarkdown = `---
title: Convert bank statement to CSV
description: A practical bank statement to CSV converter for PDF uploads, sample preview, paid export, and reviewable fictional sample data.
---

# Convert bank statement to CSV

Use AI Converter when you have a bank statement PDF and need transaction rows you can inspect in a spreadsheet.

The current workflow is direct upload only. Email monitoring is not the intake path.

## Output columns

The sample CSV uses date, description, money in, money out, and balance columns. Real outputs depend on what can be safely extracted from the uploaded PDF.

AI Converter is not for bank login access, tax advice, accounting review, guaranteed categorization, or files that require human judgment.

## Try the sample

Download the fictional sample CSV at https://aiconverter.app/sample-bank-statement.csv.
`;

const sampleMarkdown = `---
title: Sample bank statement CSV
description: Download a fictional CSV showing the bank statement output shape used by AI Converter.
---

# Sample bank statement CSV

Download a fictional CSV sample to see the output shape before uploading a real PDF.

The sample data is fictional. It is not a customer file and does not contain real bank statement data.

Columns: date, description, money_in, money_out, balance.

Real exports depend on what can be safely extracted from your PDF.
`;

const privacyMarkdown = `---
title: Privacy Policy - AI Converter
description: How AI Converter handles uploaded source files, generated files, local image/SVG conversion, payment status, and short retention.
---

# Privacy Policy

Last updated May 17, 2026.

AI Converter is built for private upload, short retention, minimal job metadata, and preview-first conversion. We do not ask for bank credentials, and sensitive files should not be sent through support.

## Information collected

- Uploaded source file.
- Generated preview rows and converted output files.
- Optional email for payment receipt and job recovery.
- Payment status, payment ID, selected plan, timestamps, and job status.
- Security metadata such as hashed IP, hashed user agent, file hash, and abuse-limit events.

AI Converter does not ask for bank login credentials.

## Processing

Files are used to produce the output you requested. Digital bank statement PDFs are parsed directly first. Mistral OCR may be used for scanned, image-heavy, receipt, invoice, screenshot, or messy files when configured. Cloudflare Workers AI may be used for audio transcript, document Markdown, and screenshot-to-HTML beta modules when configured. CloudConvert may be used for universal provider conversion when configured. Azure Document Intelligence may be used as an optional paid-job fallback when configured. PNG/JPG/WEBP image-format and raster-to-SVG conversion run locally in the browser and do not upload the image to AI Converter for those routes.

Low-confidence files fail closed instead of being sent to a human review queue.

## Retention

Source files are kept only for preview, paid unlock, and the automatic redo window. Source files are deleted after failed preview, failed full extraction, completed redo, or the 24-hour private source lifecycle. Generated files expire after 7 days. Browser-local image/SVG conversions do not create server-side source files.

## Requests

Use https://aiconverter.app/support for deletion, privacy, or payment-related requests. Do not send source files through support.
`;

const termsMarkdown = `---
title: Terms of Service - AI Converter
description: Terms for using AI Converter's automated conversion and local image/SVG conversion service.
---

# Terms of Service

Last updated May 17, 2026.

AI Converter provides automated file conversion and browser-local image tools. It is a data conversion tool, not accounting, tax, legal, lending, compliance, or financial advice.

## Workflow

The first production AI workflow is bank statement PDF to CSV. Receipt, invoice, screenshot-table, audio transcript, document Markdown, screenshot-to-HTML, and universal provider conversion are beta/provider routes when configured. Upload a supported file, review a free sample preview, then pay once to generate and download the selected output. PNG/JPG/WEBP image-format and raster-to-SVG conversion run locally in the browser.

## User responsibility

You are responsible for checking exported files before using them for bookkeeping, taxes, lending, legal, compliance, or decision-making work. Automated extraction and provider conversion can be wrong, especially on unusual, scanned, damaged, password-protected, noisy, or low-quality files.

## Payment and access

A sample preview is free. Paid access unlocks the full extraction for the selected page pack. The service may reject files, block repeated previews, or limit access when needed to protect users, data, infrastructure, or the refund policy.

## Redo and refund

Paid jobs include one automatic stronger redo. If the stronger redo still cannot produce a usable generated file, the job is marked for refund or credit review under the refund policy.

## Prohibited use

Do not upload files you do not have the right to process. Do not upload malware, test attacks, intentionally corrupted files, or try to bypass payment, retention, rate limits, or access controls.
`;

const refundMarkdown = `---
title: Refund Policy - AI Converter
description: AI Converter refund, redo, and anti-abuse policy for paid generated exports.
---

# Refund Policy

Last updated May 17, 2026.

You should not pay for a blind export. AI Converter shows a preview first, gives paid jobs one stronger automatic redo, and records refund or credit due when a paid conversion still cannot produce a usable file.

## Free preview

If AI Converter cannot safely produce a sample preview, there is no charge. The file fails closed instead of being routed to a human queue.

## Paid export retry

Paid jobs include one stronger automatic redo. Use it when the full generated file is incomplete, badly formatted, missing rows or fields, or otherwise not usable.

## Refund or credit

If a paid job still cannot produce a usable generated file after the stronger redo, AI Converter records refund or credit due. If a usable file has already been delivered and downloaded, support may offer credit instead of a cash refund depending on the issue and abuse signals.

## Anti-abuse limits

Repeated free previews from the same file or connection are limited. Each paid job gets one automatic stronger redo. Payment IDs are bound to one job and cannot be reused.

## Help

Use https://aiconverter.app/support with your job ID, payment email, and a short issue description. Do not send source files through support.
`;

const securityMarkdown = `---
title: Security - AI Converter
description: Security controls for AI Converter uploads, job access, retention, abuse prevention, and OCR fallback.
---

# Security

AI Converter is designed for files you would not put in a shared inbox: private storage, tokened job access, short source retention, abuse limits, and low-confidence failures instead of human file review.

## Upload and storage controls

- Uploaded files and generated files are stored in private object storage.
- Files are not exposed through public object URLs.
- Job access requires a job ID and random token.
- API responses are marked no-store.

## Processing controls

Digital bank statement PDFs use the native parser first. OCR fallback is reserved for scanned, photo-based, receipt, invoice, screenshot, or messy files when configured. Workers AI is used for audio transcript, document Markdown, and screenshot-to-HTML beta modules when configured. CloudConvert is the primary universal provider route, with Convertio as the configured backup route. Browser-local image-format and raster-to-SVG conversion do not upload files to AI Converter. Low-confidence AI extraction files fail closed.

## Retention controls

Source files are deleted after failed preview, failed full extraction, completed redo, or the 24-hour private source lifecycle. Generated files expire after 7 days.

## Anti-abuse controls

Server-side file validation, upload rate limits, same-file free preview limits, one automatic stronger redo per paid job, and unique payment binding reduce abuse.

## Limits

AI Converter currently accepts files up to 50 MB, audio-transcript files up to 25 MB, and PDFs up to 500 pages. Password-protected, corrupted, unusual, noisy, unsupported provider pairs, or low-quality files may fail.
`;

const dataRetentionMarkdown = `---
title: Data Retention - AI Converter
description: How long AI Converter keeps source files, generated files, job metadata, and abuse-prevention records.
---

# Data retention

AI Converter keeps source files only long enough to preview, unlock, redo, and download the conversion. The product is built around short retention, not long-term file storage.

## Source files

Source files are deleted after failed preview, failed full extraction, completed redo, or the 24-hour private source lifecycle.

## Generated files

Generated files expire after 7 days. Download the file after the export completes if you need a copy later.

## Local image conversions

PNG/JPG/WEBP image-format and raster-to-SVG conversions run in the browser and do not create source files, generated files, jobs, or payment records on AI Converter.

## Job metadata

Minimal metadata such as job status, selected plan, timestamps, row count, confidence, payment status, and refund status may be retained for payment records, abuse prevention, debugging, and compliance.

## Abuse-prevention records

Hashed connection data, file hashes, and preview-limit events may be retained long enough to limit repeated free previews, payment reuse, and refund abuse. These records are not used to train a model.

## Deletion requests

Use https://aiconverter.app/support with your job ID and payment email. Do not send source files through support.
`;

const supportMarkdown = `---
title: Support - AI Converter
description: Get help with AI Converter payment, refund, deletion, and conversion issues.
---

# Support

Use https://aiconverter.app/support for conversion, payment, refund, deletion, or security requests.

Include the job ID when you have one. Do not paste bank statements, receipts, invoices, screenshots, or source-file details into the message.

## What to include

- Job ID and payment email, if available.
- The plan selected.
- A short description of what went wrong.
- Whether the stronger redo has already been tried.

## Current support scope

Support requests are recorded for review. Security reports and payment, deletion, or refund issues are treated as priority requests.
`;

const markdownByRoute = new Map([
  ["/", markdown],
  ["/index.html", markdown],
  ["/about", aboutMarkdown],
  ["/bank-statement-pdf-to-csv", bankStatementMarkdown],
  ["/convert-bank-statement-to-csv", convertMarkdown],
  ["/sample-csv", sampleMarkdown],
  ["/privacy", privacyMarkdown],
  ["/terms", termsMarkdown],
  ["/refund", refundMarkdown],
  ["/security", securityMarkdown],
  ["/support", supportMarkdown],
  ["/data-retention", dataRetentionMarkdown]
]);

const textLikeRoutes = new Set(markdownByRoute.keys());

function wantsMarkdown(request) {
  const accept = request.headers.get("Accept") || "";
  return accept.toLowerCase().includes("text/markdown");
}

function isPageRequest(url) {
  if (url.pathname.startsWith("/api/")) return false;
  if (textLikeRoutes.has(url.pathname)) return true;
  return !url.pathname.includes(".") && !url.pathname.startsWith("/assets/");
}

function normalizePagePath(pathname) {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  if (url.hostname === "www.aiconverter.app" || url.hostname.endsWith(".pages.dev")) {
    url.hostname = "aiconverter.app";
    return withSecurityHeaders(Response.redirect(url.toString(), 301));
  }

  if ((request.method === "GET" || request.method === "HEAD") && wantsMarkdown(request) && isPageRequest(url)) {
    const markdownBody = markdownByRoute.get(normalizePagePath(url.pathname)) || markdown;
    return withSecurityHeaders(
      new Response(request.method === "HEAD" ? null : markdownBody, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          Vary: "Accept",
          "X-Markdown-Tokens": String(Math.ceil(markdownBody.length / 4)),
          "Content-Signal": "search=yes, ai-input=yes"
        }
      })
    );
  }

  const response = await context.next();
  const extraHeaders = {};
  if (url.pathname.startsWith("/api/")) {
    extraHeaders["Cache-Control"] = "no-store";
  }

  const secured = withSecurityHeaders(response, extraHeaders);
  secured.headers.append("Vary", "Accept");
  return secured;
}
