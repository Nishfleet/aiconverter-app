import test from "node:test";
import assert from "node:assert/strict";
import data from "../src/data/converters.json" with { type: "json" };
import { TOP_CONVERSION_REQUESTS, conversionRequestHref } from "../src/conversion-catalog.js";
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


