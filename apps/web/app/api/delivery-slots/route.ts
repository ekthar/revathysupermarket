import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CUSTOMER_SLOT_WINDOW_DAYS = 14;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const now = new Date();
  const end = new Date(now.getTime() + CUSTOMER_SLOT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const slots = await prisma.deliverySlot.findMany({
    where: { isActive: true, startsAt: { gt: now, lt: end } },
    orderBy: { startsAt: "asc" }
  });
  return NextResponse.json(
    { slots: slots.map((slot) => ({ id: slot.id, startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), remaining: Math.max(0, slot.capacity - slot.bookedCount), available: slot.bookedCount < slot.capacity })) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
