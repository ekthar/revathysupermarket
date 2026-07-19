import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";

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

  const redisOk = await pingRedis();
  checks.redis = redisOk ? "ok" : (process.env.REDIS_HOST ? "error" : "not configured");
  if (process.env.REDIS_HOST && !redisOk) healthy = false;

  const status = healthy ? 200 : 503;
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status });
}
