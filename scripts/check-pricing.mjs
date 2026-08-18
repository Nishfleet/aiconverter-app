import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import data from "../src/data/converters.json" with { type: "json" };
import { PLANS } from "../functions/lib/jobs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicTexts = await Promise.all([
  readFile(path.join(root, "functions/_middleware.js"), "utf8"),
  readFile(path.join(root, "public/llms.txt"), "utf8"),
  readFile(path.join(root, "ops/pricing-strategy.md"), "utf8")
]);
// The flagship landing page phrases prices as "for up to N pages"; guard it
// separately so a pricing change cannot silently drift from the live page.
// The HTML mini-grid splits price and page count into adjacent elements;
// the markdown states the full sentence.
const landingPageTexts = await Promise.all([
  readFile(path.join(root, "public/bank-statement-pdf-to-csv/index.html"), "utf8"),
  readFile(path.join(root, "public/bank-statement-pdf-to-csv/index.md"), "utf8")
]);
// The pricing route page repeats the pack prices in both the HTML plan cards
// and the agent-readable markdown alternate (which is byte-identical to the
// middleware's negotiated pricing markdown). Guard both so a pricing change
// cannot silently drift from the live /pricing/ surface.
const pricingPageTexts = await Promise.all([
  readFile(path.join(root, "public/pricing/index.html"), "utf8"),
  readFile(path.join(root, "public/pricing/index.md"), "utf8")
]);

const failures = [];

for (const plan of data.pricing) {
  const backend = PLANS[plan.id];
  if (!backend) {
    failures.push(`Missing backend plan for ${plan.id}.`);
    continue;
  }
  if (backend.price !== plan.price || backend.amount !== plan.amount || backend.pages !== plan.pages) {
    failures.push(`Pricing mismatch for ${plan.id}: frontend ${plan.price}/${plan.amount}/${plan.pages}, backend ${backend.price}/${backend.amount}/${backend.pages}.`);
  }

  const expected = `${plan.price} for ${plan.pages} pages`;
  publicTexts.forEach((text, index) => {
    if (!text.includes(expected)) {
      failures.push(`Public pricing text ${index + 1} is missing "${expected}".`);
    }
  });

  const landingExpected = `${plan.price} for up to ${plan.pages} pages`;
  if (!landingPageTexts[1].includes(landingExpected)) {
    failures.push(`Bank landing page index.md is missing "${landingExpected}".`);
  }
  const gridExpected = `<strong>${plan.price}</strong><span>${plan.pages} pages</span>`;
  if (!landingPageTexts[0].includes(gridExpected)) {
    failures.push(`Bank landing page index.html is missing "${gridExpected}".`);
  }
  if (plan.id === "starter" && !landingPageTexts[0].includes(landingExpected)) {
    failures.push(`Bank landing page index.html hero note is missing "${landingExpected}".`);
  }

  pricingPageTexts.forEach((text, index) => {
    if (!text.includes(expected)) {
      failures.push(`Pricing page text ${index + 1} is missing "${expected}".`);
    }
  });

  const offerPrice = String(plan.amount / 100);
  const pricingPageHtml = pricingPageTexts[0];
  if (!pricingPageHtml.includes(`"price": "${offerPrice}"`)) {
    failures.push(`Pricing page JSON-LD offer is missing price "${offerPrice}" for ${plan.id}.`);
  }
  if (!pricingPageHtml.includes(`"description": "${plan.pages} pages or images"`)) {
    failures.push(`Pricing page JSON-LD offer is missing the ${plan.pages}-page description for ${plan.id}.`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Pricing is consistent.");
