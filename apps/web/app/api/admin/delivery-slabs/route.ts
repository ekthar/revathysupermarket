import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { validateSlabs } from "@/lib/delivery-fee";
import { z } from "zod";
import { getStoreSettingsForApi } from "@/lib/store-settings";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ slabs: z.array(z.object({ minKm: z.coerce.number().min(0).max(50), maxKm: z.coerce.number().positive().max(50), fee: z.coerce.number().min(0).max(500) })).min(1).max(20) });

export async function GET() {
  const result = await requirePermission("pricing.manage");
  if ("error" in result) return result.error;

  // Delivery fee slabs are admin-managed, typically <10 rows - no take limit needed
  const slabs = await prisma.deliveryFeeSlab.findMany({
    where: { isActive: true },
    orderBy: { minKm: "asc" },
  });

  return NextResponse.json({ slabs });
}

export async function PUT(req: Request) {
  const result = await requirePermission("pricing.manage");
  if ("error" in result) return result.error;

  const limit = await enforceRateLimit(`admin:pricing:${result.ctx.userId}`, 20, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter valid distance ranges and fees.", code: "VALIDATION_ERROR", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const slabs = parsed.data.slabs;

  // Validate
  const settings = await getStoreSettingsForApi();
  const validation = validateSlabs(slabs, settings.deliveryRadiusKm);
  if (!validation.valid) {
    return NextResponse.json({ error: "Invalid slab configuration", code: "VALIDATION_ERROR", fieldErrors: validation.errors }, { status: 400 });
  }

  // Replace all slabs atomically
  await prisma.$transaction(async (tx) => {
    // Deactivate existing slabs
    await tx.deliveryFeeSlab.updateMany({ where: { isActive: true }, data: { isActive: false } });

    // Create new slabs
    for (const slab of slabs) {
      await tx.deliveryFeeSlab.create({
        data: { minKm: slab.minKm, maxKm: slab.maxKm, fee: slab.fee, isActive: true },
      });
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: result.ctx.userId,
      actorRole: result.ctx.role,
      action: "delivery_slabs.update",
      targetType: "DeliveryFeeSlab",
      targetId: "all",
      metadata: { slabs },
    },
  });

  const newSlabs = await prisma.deliveryFeeSlab.findMany({ where: { isActive: true }, orderBy: { minKm: "asc" } });
  return NextResponse.json({ slabs: newSlabs });
}
