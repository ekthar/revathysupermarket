import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { validateSlabs } from "@/lib/delivery-fee";

export async function GET() {
  const result = await requirePermission("pricing.manage");
  if ("error" in result) return result.error;

  const slabs = await prisma.deliveryFeeSlab.findMany({
    where: { isActive: true },
    orderBy: { minKm: "asc" },
  });

  return NextResponse.json({ slabs });
}

export async function PUT(req: Request) {
  const result = await requirePermission("pricing.manage");
  if ("error" in result) return result.error;

  const body = await req.json();
  const { slabs } = body as { slabs: { id?: string; minKm: number; maxKm: number; fee: number }[] };

  if (!slabs || !Array.isArray(slabs) || slabs.length === 0) {
    return NextResponse.json({ error: "At least one slab is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Validate
  const validation = validateSlabs(slabs);
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
