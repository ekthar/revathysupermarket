import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * PATCH /api/mobile/v1/admin/delivery-slabs/[id]
 * Update a delivery fee slab.
 *
 * DELETE /api/mobile/v1/admin/delivery-slabs/[id]
 * Remove a delivery fee slab.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { minKm, maxKm, fee, isActive } = body;

  const data: Record<string, unknown> = {};
  if (minKm !== undefined) data.minKm = minKm;
  if (maxKm !== undefined) data.maxKm = maxKm;
  if (fee !== undefined) data.fee = fee;
  if (isActive !== undefined) data.isActive = isActive;

  const slab = await prisma.deliveryFeeSlab.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    data: {
      id: slab.id,
      minKm: Number(slab.minKm),
      maxKm: Number(slab.maxKm),
      fee: Number(slab.fee),
      isActive: slab.isActive,
      createdAt: slab.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.deliveryFeeSlab.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
