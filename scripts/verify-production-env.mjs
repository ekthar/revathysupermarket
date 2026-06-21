const production = process.env.VERCEL_ENV === "production";
const required = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
const missing = production ? required.filter((name) => !process.env[name]) : [];

if (missing.length) {
  console.error(`Missing required production environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
