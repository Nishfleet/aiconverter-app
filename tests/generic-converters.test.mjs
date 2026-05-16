import test from "node:test";
import assert from "node:assert/strict";
import { convertFileToCsv } from "../functions/lib/extract.js";
import { assertSupportedUpload } from "../functions/lib/jobs.js";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;

test("receipt converter creates an expense CSV from OCR markdown", async () => {
  const calls = mockFetch({
    pages: [
      {
        markdown: [
          "# Central Coffee",
          "Date 05/12/2026",
          "Latte $4.50",
          "Bagel $3.25",
          "Tax $0.62",
          "Visa **** 4242",
          "TOTAL $8.37"
        ].join("\n"),
        confidence_scores: { average_page_confidence_score: 0.94 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "receipt",
    "receipt.png",
    "image/png",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].document.type, "image_url");
  assert.equal(result.columns[1].key, "vendor");
  assert.match(result.csv, /Central Coffee/);
  assert.match(result.csv, /Meals/);
  assert.match(result.csv, /card/);
  assert.match(result.csv, /0.62/);
  assert.match(result.csv, /8.37/);
  restoreFetch();
});

test("receipt converter exports one row per readable receipt page", async () => {
  mockFetch({
    pages: [
      {
        markdown: "Central Coffee\nDate 05/12/2026\nLatte $4.50\nTOTAL $4.50",
        confidence_scores: { average_page_confidence_score: 0.93 }
      },
      {
        markdown: "Cloud Hosting Inc\nInvoice\nDate 05/13/2026\nSubtotal $20.00\nTax $2.00\nAmount Paid $22.00\nMastercard",
        confidence_scores: { average_page_confidence_score: 0.9 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "receipt",
    "receipts.pdf",
    "application/pdf",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.equal(result.rowCount, 2);
  assert.match(result.csv, /Central Coffee/);
  assert.match(result.csv, /Cloud Hosting Inc/);
  assert.match(result.csv, /Software/);
  restoreFetch();
});

test("screenshot converter uses OCR table blocks when markdown has placeholders", async () => {
  const calls = mockFetch({
    pages: [
      {
        markdown: "[tbl-0.md](tbl-0.md)",
        tables: [
          {
            markdown: [
              "| Date | Item | Amount |",
              "| --- | --- | --- |",
              "| Smoke 2026-05-13T05:29:00.423Z | | |",
              "| 2026-05-01 | Hosting | $12.30 |",
              "| 2026-05-02 | Domain | $10.46 |"
            ].join("\n")
          }
        ],
        confidence_scores: { average_page_confidence_score: 0.91 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "screenshot",
    "table.png",
    "image/png",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.equal(result.rowCount, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].document.type, "image_url");
  assert.deepEqual(result.columns.map((column) => column.label), ["Date", "Item", "Amount"]);
  assert.match(result.csv, /Hosting/);
  assert.match(result.csv, /Domain/);
  restoreFetch();
});

test("screenshot converter parses html tables from OCR output", async () => {
  mockFetch({
    pages: [
      {
        markdown: "<table><tr><th>Date</th><th>Vendor</th><th>Total</th></tr><tr><td>2026-05-01</td><td>Hosting</td><td>$12.30</td></tr></table>",
        confidence_scores: { average_page_confidence_score: 0.9 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "screenshot",
    "table.png",
    "image/png",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.columns.map((column) => column.label), ["Date", "Vendor", "Total"]);
  assert.match(result.csv, /Hosting/);
  restoreFetch();
});

test("screenshot converter recovers obvious rows from plain OCR text", async () => {
  mockFetch({
    pages: [
      {
        markdown: "Date Item Amount 2026-05-01 Hosting $12.30 2026-05-02 Domain $10.46",
        confidence_scores: { average_page_confidence_score: 0.88 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "screenshot",
    "table.png",
    "image/png",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.equal(result.rowCount, 2);
  assert.deepEqual(result.columns.map((column) => column.label), ["Date", "Description", "Amount"]);
  assert.match(result.csv, /Hosting/);
  assert.match(result.csv, /Domain/);
  restoreFetch();
});

test("invoice converter creates a structured invoice CSV from OCR markdown", async () => {
  mockFetch({
    pages: [
      {
        markdown: [
          "Cloud Hosting Inc",
          "Invoice # INV-2026-042",
          "Invoice Date May 10 2026",
          "Due Date May 24 2026",
          "Hosting plan $220.00",
          "Tax $22.00",
          "Amount Due $242.00",
          "Payment terms Net 14"
        ].join("\n"),
        confidence_scores: { average_page_confidence_score: 0.93 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "invoice",
    "invoice.pdf",
    "application/pdf",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.equal(result.outputFormat, "csv");
  assert.equal(result.columns[0].key, "vendor");
  assert.match(result.csv, /Cloud Hosting Inc/);
  assert.match(result.csv, /INV-2026-042/);
  assert.match(result.csv, /242/);
  assert.match(result.csv, /Net 14/i);
  restoreFetch();
});

test("invoice converter can produce JSON for structured workflows", async () => {
  mockFetch({
    pages: [
      {
        markdown: [
          "Cloud Hosting Inc",
          "Invoice Number INV-2026-042",
          "Invoice Date 2026-05-10",
          "Due Date 2026-05-24",
          "Usage overage $20.00",
          "Subtotal $220.00",
          "Tax $22.00",
          "Grand Total $242.00"
        ].join("\n"),
        confidence_scores: { average_page_confidence_score: 0.93 }
      }
    ]
  });

  const result = await convertFileToCsv(
    { MISTRAL_API_KEY: "test-key" },
    "invoice",
    "invoice.pdf",
    "application/pdf",
    PNG_BYTES,
    { outputFormat: "json" }
  );

  const parsed = JSON.parse(result.content);
  assert.equal(result.ok, true);
  assert.equal(result.outputFormat, "json");
  assert.equal(parsed.invoice.invoice_number, "INV-2026-042");
  assert.equal(parsed.invoice.total, 242);
  assert.ok(Array.isArray(parsed.line_items));
  restoreFetch();
});

test("audio converter creates TXT transcript with Workers AI", async () => {
  const result = await convertFileToCsv(
    {
      AI: {
        async run(model, input) {
          assert.equal(model, "@cf/openai/whisper-large-v3-turbo");
          assert.equal(typeof input.audio, "string");
          assert.ok(input.audio.length > 0);
          return { text: "Close the books and export the statement rows.", word_count: 8 };
        }
      }
    },
    "audio-transcript",
    "memo.mp3",
    "audio/mpeg",
    new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer
  );

  assert.equal(result.ok, true);
  assert.equal(result.outputFormat, "txt");
  assert.match(result.content, /Close the books/);
  assert.match(result.csv, /word_count/);
});

test("audio converter sends larger files as one base64 audio file instead of a huge byte array", async () => {
  const calls = [];
  const bytes = new Uint8Array(1024 * 1024 + 8);
  bytes.set([0xff, 0xfb, 0x90, 0x64], 0);

  const result = await convertFileToCsv(
    {
      AI: {
        async run(model, input) {
          calls.push({ model, input });
          assert.equal(typeof input.audio, "string");
          assert.ok(input.audio.length > bytes.byteLength);
          return { text: "whole file transcript", word_count: 3 };
        }
      }
    },
    "audio-transcript",
    "memo.mp3",
    "audio/mpeg",
    bytes.buffer
  );

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.match(result.content, /whole file transcript/);
  assert.deepEqual(result.warnings, []);
});

test("audio upload validation accepts ADTS AAC files that are advertised in the UI", () => {
  const bytes = new Uint8Array([0xff, 0xf1, 0x50, 0x80, 0x00, 0x1f, 0xfc, 0x00]);
  const file = { name: "voice.aac", type: "audio/aac", size: bytes.byteLength };
  assert.equal(assertSupportedUpload(file, bytes.buffer, "audio-transcript"), "");
});

test("audio converter can produce JSON transcript", async () => {
  const result = await convertFileToCsv(
    {
      AI: {
        async run() {
          return { text: "Review the invoice before Friday.", word_count: 6, vtt: "WEBVTT" };
        }
      }
    },
    "audio-transcript",
    "memo.mp3",
    "audio/mpeg",
    new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer,
    { outputFormat: "json" }
  );

  const parsed = JSON.parse(result.content);
  assert.equal(result.ok, true);
  assert.equal(result.outputFormat, "json");
  assert.equal(parsed.word_count, 6);
  assert.match(parsed.transcript, /invoice/);
});

test("document converter creates Markdown from Workers AI markdown conversion", async () => {
  const result = await convertFileToCsv(
    {
      AI: {
        async toMarkdown(file) {
          assert.equal(file.name, "plan.docx");
          assert.ok(file.blob);
          return {
            format: "markdown",
            mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            tokens: 42,
            data: "# Operating plan\n\n- Close books\n- Export rows"
          };
        }
      }
    },
    "document-markdown",
    "plan.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer
  );

  assert.equal(result.ok, true);
  assert.equal(result.outputFormat, "md");
  assert.match(result.content, /Operating plan/);
  assert.match(result.csv, /tokens/);
});

test("screenshot to HTML creates an honest starter file", async () => {
  const result = await convertFileToCsv(
    {
      AI: {
        async toMarkdown() {
          return {
            format: "markdown",
            mimetype: "image/png",
            tokens: 35,
            data: "# Settings\n\n- Profile\n- Billing\n\nSave changes"
          };
        }
      }
    },
    "screenshot-code",
    "settings.png",
    "image/png",
    PNG_BYTES
  );

  assert.equal(result.ok, true);
  assert.equal(result.outputFormat, "html");
  assert.match(result.content, /<!doctype html>/);
  assert.match(result.content, /Settings/);
  assert.match(result.warnings.join(" "), /not a pixel-perfect clone/);
});

let originalFetch = globalThis.fetch;

function mockFetch(payload) {
  const calls = [];
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body);
    return {
      ok: true,
      status: 200,
      async json() {
        return payload;
      }
    };
  };
  return calls;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}
