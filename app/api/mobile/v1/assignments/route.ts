import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const acknowledgeSchema = z.object({
  eventId: z.string().min(1),
});

export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.assignmentEvent.findMany({
    where: {
      partnerId: auth.userId,
      acknowledgedAt: null,
    },
    orderBy: { assignedAt: "desc" },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = acknowledgeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { eventId } = parsed.data;

  const event = await prisma.assignmentEvent.findUnique({
    where: { eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Ownership check: only the assigned partner can acknowledge
  if (event.partnerId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Idempotent: if already acknowledged, return success
  if (event.acknowledgedAt) {
    return NextResponse.json({ event, alreadyAcknowledged: true });
  }

  const updated = await prisma.assignmentEvent.update({
    where: { eventId },
    data: { acknowledgedAt: new Date() },
  });

  return NextResponse.json({ event: updated });
}
