import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import data from "../src/data/converters.json" with { type: "json" };
import { TOP_CONVERSION_REQUESTS, conversionRequestHref } from "../src/conversion-catalog.js";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

function converterById(converterId) {
  return data.converters.find((converter) => converter.id === converterId) || null;
}

test("every highlighted request maps to a live converter and a real output format", () => {
  for (const request of TOP_CONVERSION_REQUESTS) {
    const converter = converterById(request.converterId);
    assert.ok(converter, `${request.label} converter ${request.converterId} must exist`);
    assert.notEqual(converter.id, "email", `${request.label} must not point at the email monitor`);
    assert.ok(request.outputId, `${request.label} must declare an outputId for its intent link`);

    const formats = converter.outputFormats || [];
    const offered =
      formats.some((format) => format.id === request.outputId) ||
      request.outputId === "csv" ||
      converter.id === "receipt" ||
      converter.id === "screenshot";
    assert.ok(offered, `${request.label} outputId ${request.outputId} must be offered by ${converter.id} (or the csv fallback)`);
  }
});

test("conversionRequestHref builds a root intent link per highlighted request", () => {
  for (const request of TOP_CONVERSION_REQUESTS) {
    const href = conversionRequestHref(request);
    assert.match(href, /^\/\?converter=/);
    const params = new URL(`https://aiconverter.app${href}`).searchParams;
    assert.equal(params.get("converter"), request.converterId, `${request.label} href should carry converter=${request.converterId}`);
    assert.equal(params.get("output"), request.outputId, `${request.label} href should carry output=${request.outputId}`);
  }
});

test("homepage renders popular-request chips as intent links", () => {
  assert.match(source, /conversionRequestHref/);
  assert.match(source, /className="ticker-chip"/);
  assert.match(source, /href=\{item\.href\}/);
  assert.match(source, /tabIndex=\{-1\}/, "duplicate marquee chips must not become tab stops");
});

test("screen-reader popular-requests list carries the same intent links", () => {
  assert.match(source, /<ul className="sr-only">/);
  assert.match(source, /<a href=\{item\.href\}>\{item\.label\}<\/a>/);
});

test("ticker pauses on hover so moving chips are clickable", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.conversion-ticker:hover .conversion-ticker-track/);
  assert.match(css, /animation-play-state: paused/);
});
