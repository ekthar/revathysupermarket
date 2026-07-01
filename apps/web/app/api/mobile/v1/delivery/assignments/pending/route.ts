import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/delivery/assignments/pending
 * Returns pending (unacknowledged) assignment events for the current delivery partner.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.assignmentEvent.findMany({
    where: {
      partnerId: auth.userId,
      acknowledgedAt: null,
    },
    orderBy: { assignedAt: "desc" },
  });

  return NextResponse.json({ events });
}
