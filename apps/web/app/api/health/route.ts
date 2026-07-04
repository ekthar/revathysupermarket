import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    healthy = false;
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
      healthy = false;
    }
  } else {
    checks.redis = "not configured";
  }

  const status = healthy ? 200 : 503;
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status });
}
