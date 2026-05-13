import test from "node:test";
import assert from "node:assert/strict";
import { convertFileToCsv } from "../functions/lib/extract.js";

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
