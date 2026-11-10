import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function listApiFiles(dir, prefix = "api/") {
	const out = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			out.push(...listApiFiles(path, `${prefix}${name}/`));
		} else if (name.endsWith(".js")) {
			out.push(`${prefix}${name}`);
		}
	}
	return out;
}

test("the committed Worker entry bundles every functions/api module (Pages routing rule)", () => {
	const source = readFileSync(join(root, "worker", "index.js"), "utf8");
	assert.match(
		source,
		/import\.meta\.glob\("\.\.\/functions\/api\/\*\*\/\*\.js", \{ eager: true \}\)/,
		"the entry must glob the whole functions/api tree, never a copied route table"
	);
	assert.match(source, /const mod = routeModules\[`\.\.\/functions\$\{path\}\.js`\]/, "each route module must be found by its Pages URL");

	const routeFiles = listApiFiles(join(root, "functions", "api"));
	assert.ok(routeFiles.length > 0, "functions/api is empty");
	for (const file of routeFiles) {
		const body = readFileSync(join(root, "functions", file), "utf8");
		assert.match(
			body,
			/export (const|async function|function) onRequest(Get|Post|Delete|Patch|Put)?\b/,
			`${file} must export an onRequest handler`
		);
	}
});

test("the static assets build carries the Worker bundle and the dated sitemap", (t) => {
	const out = join(root, ".cloudflare", "output", "v0", "workers", "default");
	if (!statSync(out, { throwIfNoEntry: false })) return t.skip("npm run build has not run in this checkout");
	const bundle = readFileSync(join(out, "bundle", "index.js"), "utf8");
	assert.ok(bundle.includes("functions/_middleware.js") || bundle.includes("_middleware"), "the bundle must run the Pages middleware first");
	assert.ok(readFileSync(join(out, "assets", "sitemap.xml"), "utf8").includes("<urlset"), "the assets must ship the dated sitemap");
});
