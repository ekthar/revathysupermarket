import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/delivery-partners
 * Returns a list of active delivery partners for order assignment in the admin app.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partners = await prisma.user.findMany({
    where: {
      role: "DELIVERY_PARTNER",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      locationUpdatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    partners: partners.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone || "",
      lastSeenAt: p.locationUpdatedAt?.toISOString() ?? null,
    })),
  });
}
