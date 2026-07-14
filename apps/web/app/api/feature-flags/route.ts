import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

/**
 * GET /api/feature-flags — List all feature flags (admin/owner only)
 */
export async function GET() {
  const result = await requireRole(["ADMIN", "OWNER"]);
  if (result instanceof NextResponse) return result;

  const flags = await prisma.featureFlag.findMany({
    select: { key: true, enabled: true, config: true },
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ flags });
}

/**
 * PUT /api/feature-flags — Update a single feature flag (admin/owner only)
 */
export async function PUT(request: Request) {
  const result = await requireRole(["ADMIN", "OWNER"]);
  if (result instanceof NextResponse) return result;

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

  // Sync store_open_hours config to the Setting table so that
  // isStoreCurrentlyOpen() uses the correct times.
  if (key === "store_open_hours") {
    const flagConfig = (config ?? existing.config) as Record<string, unknown> | null;
    const operations: Array<ReturnType<typeof prisma.setting.upsert>> = [];

    if (flagConfig?.open && typeof flagConfig.open === "string") {
      operations.push(
        prisma.setting.upsert({
          where: { key: "storeOpenTime" },
          update: { value: flagConfig.open },
          create: { key: "storeOpenTime", value: flagConfig.open },
        })
      );
    }
    if (flagConfig?.close && typeof flagConfig.close === "string") {
      operations.push(
        prisma.setting.upsert({
          where: { key: "storeCloseTime" },
          update: { value: flagConfig.close },
          create: { key: "storeCloseTime", value: flagConfig.close },
        })
      );
    }
    // If autoToggle is enabled, also update the isStoreOpen setting based on current time
    if (flagConfig?.autoToggle === true) {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      const openStr = (flagConfig.open as string) || "08:00";
      const closeStr = (flagConfig.close as string) || "21:00";
      const [openH, openM] = openStr.split(":").map(Number);
      const [closeH, closeM] = closeStr.split(":").map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      const shouldBeOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      operations.push(
        prisma.setting.upsert({
          where: { key: "isStoreOpen" },
          update: { value: String(shouldBeOpen) },
          create: { key: "isStoreOpen", value: String(shouldBeOpen) },
        })
      );
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
      revalidateTag("store-settings");
    }
  }

  return NextResponse.json({ flag: updated });
}
