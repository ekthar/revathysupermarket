import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const updateSchema = z.object({
  id: z.string().min(1),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
});

function serviceDateFor(startsAt: Date) {
  const localDate = startsAt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Date(`${localDate}T00:00:00.000Z`);
}

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

/**
 * PATCH /api/mobile/v1/admin/delivery-slots
 * Update an existing delivery slot.
 */
export async function PATCH(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slot update.", details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.deliverySlot.findUnique({ where: { id: parsed.data.id } });
  if (!current) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

  const startsAt = parsed.data.startsAt ?? current.startsAt;
  const endsAt = parsed.data.endsAt ?? current.endsAt;
  const capacity = parsed.data.capacity ?? current.capacity;
  if (endsAt <= startsAt) return NextResponse.json({ error: "End time must follow start time." }, { status: 400 });
  if (capacity < current.bookedCount) {
    return NextResponse.json({ error: "Capacity cannot be lower than current bookings." }, { status: 400 });
  }

  try {
    const slot = await prisma.deliverySlot.update({
      where: { id: parsed.data.id },
      data: {
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        capacity: parsed.data.capacity,
        isActive: parsed.data.isActive,
        serviceDate: parsed.data.startsAt ? serviceDateFor(parsed.data.startsAt) : undefined,
      },
    });
    return NextResponse.json({ slot });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A slot already exists for that date and time." }, { status: 409 });
    }
    throw error;
  }
}
