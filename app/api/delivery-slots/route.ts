import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const now = new Date();
  const end = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const slots = await prisma.deliverySlot.findMany({
    where: { isActive: true, endsAt: { gt: now, lte: end } },
    orderBy: { startsAt: "asc" }
  });
  return NextResponse.json({ slots: slots.map((slot) => ({ id: slot.id, startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), remaining: Math.max(0, slot.capacity - slot.bookedCount), available: slot.bookedCount < slot.capacity })) });
}
