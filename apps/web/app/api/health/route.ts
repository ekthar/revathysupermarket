import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check endpoint.
 * 
 * Checks:
 * - Database connectivity (Prisma ping)
 * - Redis connectivity (Upstash ping)
 * - Build SHA for release tracking
 * 
 * Returns 200 if all checks pass, 503 if any fail.
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = { status: "error", latencyMs: Date.now() - dbStart, error: e instanceof Error ? e.message : "Unknown" };
  }

  // Redis check
  const redisStart = Date.now();
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
      } else {
        checks.redis = { status: "error", latencyMs: Date.now() - redisStart, error: `HTTP ${res.status}` };
      }
    } else {
      checks.redis = { status: "error", error: "Not configured" };
    }
  } catch (e) {
    checks.redis = { status: "error", latencyMs: Date.now() - redisStart, error: e instanceof Error ? e.message : "Unknown" };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");
  const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "local";

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      version: buildSha,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      totalLatencyMs: Date.now() - startTime,
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
