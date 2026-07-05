import { fileURLToPath } from "node:url";

// DIRECT_DATABASE_URL is only required when DATABASE_URL uses Neon's pooled HTTP proxy.
// If missing, the build proceeds with a warning — it's only needed at runtime for certain Prisma operations.
export const requiredProductionEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
];

export function isProductionEnv(env = process.env) {
  // VERCEL_ENV is only "production" for vercel-prod deployments.
  // NODE_ENV alone is unreliable because Vercel sets it to "production" during all builds.
  if ("VERCEL_ENV" in env) return env.VERCEL_ENV === "production";
  return env.NODE_ENV === "production";
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
