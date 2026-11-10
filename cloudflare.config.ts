import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./worker/index.js" with { type: "cf-worker" };

// The site and its Pages Functions serve as one Worker (aiconverter.app#341):
// the static assets are the built public/ + dist site, and worker/index.js
// routes /api/* through the functions/ modules under the same middleware that
// the Pages runtime runs. The bindings are the live ones; secrets are not
// There is no `domains` entry yet: the apex still serves from Cloudflare Pages
// (docs/ops/dns.md and docs/ops/worker.md), and moving it to the Worker is the
// separate DNS cutover those docs describe.
const previewWorker = {
	name: "aiconverter",
	compatibilityDate: "2026-05-12",
	previewUrls: true,
	entrypoint,
	assets: {
		runWorkerFirst: ["/api/*"],
		notFoundHandling: "404-page",
	},
};

export default defineConfig(({ isPreview }) => ({
	worker: isPreview
		? previewWorker
		: {
				...previewWorker,
				env: {
					AUTO_REFUNDS_ENABLED: bindings.text("true"),
					CLOUDCONVERT_DAILY_JOB_LIMIT: bindings.text("10"),
					CLOUDCONVERT_MIN_CREDITS: bindings.text("1"),
					CLOUDCONVERT_REQUIRE_CREDIT_CHECK: bindings.text("true"),
					ENABLE_AZURE_FALLBACK: bindings.text("false"),
					FREE_DOWNLOADS_ENABLED: bindings.text("false"),
					CONVERTIO_DAILY_JOB_LIMIT: bindings.text("10"),
						RATE_LIMIT_MAX_PER_HOUR: bindings.text("8"),
					AICONVERTER_DB: bindings.d1({
						name: "aiconverter",
						id: "376080eb-60f1-4bb8-aabb-06622acabb63",
					}),
					AICONVERTER_BUCKET: bindings.r2({
						name: "aiconverter-private",
					}),
					AI: bindings.ai({}),
				},
			},
}));
