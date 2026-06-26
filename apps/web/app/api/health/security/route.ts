import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export async function GET() {
  const configured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!configured) {
    return NextResponse.json({
      ok: process.env.NODE_ENV !== "production",
      rateLimiting: "unconfigured",
      configured: false,
      provider: "upstash",
      failClosed: process.env.NODE_ENV === "production",
      message: process.env.NODE_ENV === "production"
        ? "Rate limiting is required in production but Upstash Redis is not configured."
        : "Rate limiting will use the local in-memory fallback outside production."
    }, { status: process.env.NODE_ENV === "production" ? 503 : 200 });
  }
  try {
    await Redis.fromEnv().ping();
    return NextResponse.json({ ok: true, rateLimiting: "available", configured: true, provider: "upstash", failClosed: true });
  } catch {
    return NextResponse.json({
      ok: false,
      rateLimiting: "unavailable",
      configured: true,
      provider: "upstash",
      failClosed: true,
      message: "Upstash Redis is configured but did not respond to a health check."
    }, { status: 503, headers: { "Retry-After": "30" } });
  }
}
