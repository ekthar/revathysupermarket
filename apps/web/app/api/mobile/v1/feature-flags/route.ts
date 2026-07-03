import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const updateSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

/**
 * GET /api/mobile/v1/feature-flags
 * List all feature flags.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const flags = await prisma.featureFlag.findMany({
    select: { key: true, enabled: true, config: true },
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ flags });
}

/**
 * PUT /api/mobile/v1/feature-flags
 * Update a single feature flag.
 */
export async function PUT(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { key, enabled, config } = parsed.data;

  // Check flag exists
  const existing = await prisma.featureFlag.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  // Build update payload (only provided fields)
  const updateData: { enabled?: boolean; config?: Prisma.InputJsonValue | typeof Prisma.JsonNull } = {};
  if (enabled !== undefined) updateData.enabled = enabled;
  if (config !== undefined) updateData.config = config === null ? Prisma.JsonNull : config as Prisma.InputJsonValue;

  const updated = await prisma.featureFlag.update({
    where: { key },
    data: updateData,
    select: { key: true, enabled: true, config: true },
  });

  return NextResponse.json({ flag: updated });
}
