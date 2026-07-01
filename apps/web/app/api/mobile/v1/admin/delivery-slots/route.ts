import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/delivery-slots
 * All delivery slots.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slots = await prisma.deliverySlot.findMany({
    orderBy: [{ serviceDate: "asc" }, { startsAt: "asc" }],
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      serviceDate: s.serviceDate.toISOString(),
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      capacity: s.capacity,
      bookedCount: s.bookedCount,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/mobile/v1/admin/delivery-slots
 * Create a new delivery slot.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { serviceDate, startsAt, endsAt, capacity, isActive } = body;

  if (!serviceDate || !startsAt || !endsAt || !capacity) {
    return NextResponse.json({ error: "Missing required fields: serviceDate, startsAt, endsAt, capacity" }, { status: 400 });
  }

  const slot = await prisma.deliverySlot.create({
    data: {
      serviceDate: new Date(serviceDate),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      capacity,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ slot }, { status: 201 });
}
