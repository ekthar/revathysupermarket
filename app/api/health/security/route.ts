import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export async function GET() {
  const configured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!configured) return NextResponse.json({ ok: false, rateLimiting: "unconfigured" }, { status: process.env.NODE_ENV === "production" ? 503 : 200 });
  try {
    await Redis.fromEnv().ping();
    return NextResponse.json({ ok: true, rateLimiting: "available" });
  } catch {
    return NextResponse.json({ ok: false, rateLimiting: "unavailable" }, { status: 503, headers: { "Retry-After": "30" } });
  }
}
