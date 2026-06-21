import { fileURLToPath } from "node:url";

export const requiredProductionEnv = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];

export function isProductionEnv(env = process.env) {
  return env.VERCEL_ENV === "production" || env.NODE_ENV === "production";
}

export function missingProductionEnv(env = process.env) {
  if (!isProductionEnv(env)) return [];
  return requiredProductionEnv.filter((name) => !env[name]);
}

export function verifyProductionEnv(env = process.env) {
  const missing = missingProductionEnv(env);
  if (missing.length) {
    return {
      ok: false,
      missing,
      message: `Missing required production environment variables: ${missing.join(", ")}`
    };
  }
  return { ok: true, missing: [], message: "Production environment is ready." };
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const result = verifyProductionEnv();
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
}
