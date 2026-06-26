import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";

const createSchema = z.object({ startsAt: z.coerce.date(), endsAt: z.coerce.date(), capacity: z.coerce.number().int().min(1).max(500) }).refine((value) => value.endsAt > value.startsAt, { message: "End time must follow start time." });
const updateSchema = z.object({ id: z.string(), capacity: z.coerce.number().int().min(1).max(500).optional(), isActive: z.boolean().optional() });

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
  const localDate = parsed.data.startsAt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const serviceDate = new Date(`${localDate}T00:00:00.000Z`);
  const slot = await prisma.deliverySlot.create({ data: { serviceDate, ...parsed.data } });
  return NextResponse.json({ slot }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid slot update.", code: "INVALID_SLOT" }, { status: 400 });
  const slot = await prisma.deliverySlot.update({ where: { id: parsed.data.id }, data: { capacity: parsed.data.capacity, isActive: parsed.data.isActive } });
  return NextResponse.json({ slot });
}
