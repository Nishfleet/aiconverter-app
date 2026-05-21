import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import data from "../src/data/converters.json" with { type: "json" };
import { PLANS } from "../functions/lib/jobs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicTextPaths = [
  "functions/_middleware.js",
  "public/llms.txt",
  "public/llms-full.txt",
  "index.html",
  "public/bank-statement-pdf-to-csv/index.html",
  "public/bank-statement-pdf-to-csv/index.md"
];
const publicTexts = await Promise.all(publicTextPaths.map((filePath) => readFile(path.join(root, filePath), "utf8")));
const appSource = await readFile(path.join(root, "src/main.jsx"), "utf8");

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

  publicTexts.forEach((text, index) => {
    if (text.includes(plan.price)) {
      failures.push(`Public pricing text ${publicTextPaths[index]} contains fixed display price "${plan.price}".`);
    }
    if (text.includes(`"price": "${Math.round(plan.amount / 100)}"`)) {
      failures.push(`Public pricing text ${publicTextPaths[index]} contains fixed schema price for ${plan.id}.`);
    }
  });
}

if (!publicTexts.some((text) => /live (Dodo )?checkout preview/i.test(text))) {
  failures.push("Public pricing copy must state that paid unlock pricing comes from live checkout preview.");
}

for (const forbidden of ["planById(planId)?.price", "plan?.price", "|| \"₹399\""]) {
  if (appSource.includes(forbidden)) {
    failures.push(`Frontend pricing display still has fixed fallback: ${forbidden}`);
  }
}

if (!appSource.includes("Pricing unavailable") || !appSource.includes("checkoutPricingBlock")) {
  failures.push("Frontend must show a pricing-unavailable checkout block when Dodo preview cannot load.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Pricing truth checks passed.");
