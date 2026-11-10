// The Worker entry that serves the site and the API as one deployment.
// `functions/` stays the only route source: the Pages runtime and this entry
// both derive their routes from `functions/api/`, and requests run
// `functions/_middleware.js` first, exactly as Pages runs it. A request that
// matches no function goes to `env.ASSETS`, so the static site answers pages
// and the middleware's markdown/shadow-redirect behavior is preserved.
import { onRequest as middleware } from "../functions/_middleware.js";

// Eager bundle of every API route module. A new file under functions/api/ is
// served automatically when it lands; the mapping is the Pages rule:
// functions/api/x.js maps to /api/x and functions/api/admin/x.js to
// /api/admin/x.
const routeModules = import.meta.glob("../functions/api/**/*.js", { eager: true });

function methodSuffix(method) {
	const lower = method.toLowerCase();
	return lower[0].toUpperCase() + lower.slice(1);
}

function handlerFor(mod, request) {
	const suffix = methodSuffix(request.method);
	return mod[`onRequest${suffix}`] ?? mod.onRequest;
}

export default {
	/** @param {Request} request
	 *  @param {{ ASSETS: { fetch(request: Request): Promise<Response> }; }} env
	 *  @param {{ waitUntil(promise: Promise<unknown>): void }} ctx
	 *  @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
		const mod = routeModules[`../functions${path}.js`];

		const next = async (input, init) => {
			let nextRequest = request;
			if (input !== undefined) {
				nextRequest =
					typeof input === "string" || input instanceof URL
						? new Request(new URL(String(input), request.url), init)
						: /** @type {Request} */ (input);
			}
			if (!mod) return env.ASSETS.fetch(nextRequest);
			const handler = handlerFor(mod, nextRequest);
			if (!handler) return env.ASSETS.fetch(nextRequest);
			return handler({
				request: nextRequest.clone(),
				env,
				params: {},
				data: {},
				functionPath: `functions${path}`,
				waitUntil: ctx.waitUntil.bind(ctx),
				next: () => env.ASSETS.fetch(nextRequest)
			});
		};

		return middleware({
			request,
			env,
			params: {},
			data: {},
			next
		});
	}
};
