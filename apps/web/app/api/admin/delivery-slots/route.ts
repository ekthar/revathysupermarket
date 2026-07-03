import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";

const createSchema = z.object({ startsAt: z.coerce.date(), endsAt: z.coerce.date(), capacity: z.coerce.number().int().min(1).max(500) }).refine((value) => value.endsAt > value.startsAt, { message: "End time must follow start time." });
const updateSchema = z.object({
  id: z.string(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  isActive: z.boolean().optional()
});

function serviceDateFor(startsAt: Date) {
  const localDate = startsAt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Date(`${localDate}T00:00:00.000Z`);
}

export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const slots = await prisma.deliverySlot.findMany({ where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 100 });
  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid slot.", code: "INVALID_SLOT" }, { status: 400 });
  const serviceDate = serviceDateFor(parsed.data.startsAt);
  const slot = await prisma.deliverySlot.create({ data: { serviceDate, ...parsed.data } });
  return NextResponse.json({ slot }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid slot update.", code: "INVALID_SLOT" }, { status: 400 });
  const current = await prisma.deliverySlot.findUnique({ where: { id: parsed.data.id } });
  if (!current) return NextResponse.json({ error: "Slot not found.", code: "NOT_FOUND" }, { status: 404 });

  const startsAt = parsed.data.startsAt ?? current.startsAt;
  const endsAt = parsed.data.endsAt ?? current.endsAt;
  const capacity = parsed.data.capacity ?? current.capacity;
  if (endsAt <= startsAt) return NextResponse.json({ error: "End time must follow start time.", code: "INVALID_SLOT" }, { status: 400 });
  if (capacity < current.bookedCount) {
    return NextResponse.json({ error: "Capacity cannot be lower than current bookings.", code: "INVALID_CAPACITY" }, { status: 400 });
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
      }
    });
    return NextResponse.json({ slot });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A slot already exists for that date and time.", code: "DUPLICATE_SLOT" }, { status: 409 });
    }
    throw error;
  }
}
