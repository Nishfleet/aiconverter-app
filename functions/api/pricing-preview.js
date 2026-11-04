import { json, methodNotAllowed } from "../lib/http.js";
import { previewDodoPlanPrices } from "../lib/dodo.js";

export function onRequestPost() {
  return methodNotAllowed("GET");
}

/** @param {{ request: Request, env: Env }} context
 * @returns {Promise<Response>}
 */
export async function onRequestGet({ request, env }) {
  const preview = await previewDodoPlanPrices({ env, request });
  return json(preview);
}
