import { NextResponse } from "next/server";
import { pingRedis, getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

  if (!configured) {
    return NextResponse.json({
      ok: process.env.NODE_ENV !== "production",
      rateLimiting: "unconfigured",
      configured: false,
      provider: "ioredis",
      message: process.env.NODE_ENV === "production"
        ? "Rate limiting is required in production but Redis is not configured."
        : "Rate limiting will use the local in-memory fallback outside production.",
    }, { status: process.env.NODE_ENV === "production" ? 503 : 200 });
  }

  const ok = await pingRedis();
  if (ok) {
    return NextResponse.json({ ok: true, rateLimiting: "available", configured: true, provider: "ioredis" });
  }

  return NextResponse.json({
    ok: false,
    rateLimiting: "unavailable",
    configured: true,
    provider: "ioredis",
    message: "Redis is configured but did not respond to a health check.",
  }, { status: 503, headers: { "Retry-After": "30" } });
}
