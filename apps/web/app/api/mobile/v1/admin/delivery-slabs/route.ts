import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/delivery-slabs
 * List all active delivery fee slabs ordered by minKm.
 *
 * POST /api/mobile/v1/admin/delivery-slabs
 * Create a new delivery fee slab.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slabs = await prisma.deliveryFeeSlab.findMany({
    where: { isActive: true },
    orderBy: { minKm: "asc" },
  });

  return NextResponse.json({
    data: slabs.map((slab) => ({
      id: slab.id,
      minKm: Number(slab.minKm),
      maxKm: Number(slab.maxKm),
      fee: Number(slab.fee),
      isActive: slab.isActive,
      createdAt: slab.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { minKm, maxKm, fee, isActive } = body;

  if (minKm === undefined || maxKm === undefined || fee === undefined) {
    return NextResponse.json({ error: "minKm, maxKm, and fee are required" }, { status: 400 });
  }

  const slab = await prisma.deliveryFeeSlab.create({
    data: {
      minKm,
      maxKm,
      fee,
      isActive: isActive ?? true,
    },
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
  }, { status: 201 });
}
