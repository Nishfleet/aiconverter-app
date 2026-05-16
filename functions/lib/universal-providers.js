import { refreshCloudConvertConversion, startCloudConvertConversion } from "./cloudconvert.js";
import { hasZamzarConfig, refreshZamzarConversion, startZamzarConversion } from "./zamzar.js";

export async function startUniversalProviderConversion(env, job, arrayBuffer) {
  const attempts = [];

  const cloudConvert = await attemptProvider("cloudconvert", () => startCloudConvertConversion(env, job, arrayBuffer));
  if (cloudConvert.result?.ok) return cloudConvert.result;
  attempts.push(cloudConvert.failure);

  if (hasZamzarConfig(env)) {
    const zamzar = await attemptProvider("zamzar", () => startZamzarConversion(env, job, arrayBuffer));
    if (zamzar.result?.ok) return zamzar.result;
    attempts.push(zamzar.failure);
  }

  const meaningful = attempts.filter(Boolean);
  const message = meaningful.length
    ? `All provider routes failed: ${meaningful.map((attempt) => `${attempt.provider}: ${attempt.message}`).join("; ")}`
    : "No provider conversion route is configured.";

  return {
    ok: false,
    message,
    confidence: 0,
    rowCount: 0,
    provider: meaningful.at(-1)?.provider || "provider",
    attempts: meaningful
  };
}

export async function refreshUniversalProviderConversion(env, job) {
  if (job.external_provider === "zamzar") return refreshZamzarConversion(env, job);
  return refreshCloudConvertConversion(env, job);
}

async function attemptProvider(provider, run) {
  try {
    const result = await run();
    if (result?.ok) return { result, failure: null };
    return {
      result,
      failure: {
        provider,
        message: result?.message || "Provider route was unavailable."
      }
    };
  } catch (error) {
    return {
      result: null,
      failure: {
        provider,
        message: error?.message || "Provider route failed."
      }
    };
  }
}
