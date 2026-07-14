import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

/**
 * GET /api/admin/reports/staff?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns a staff-wise order report showing which staff member acknowledged
 * each order and which delivery partner delivered it.
 * Accepts optional startDate/endDate query params for date range filtering.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function GET(request: Request) {
  const result = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
  if (result instanceof NextResponse) return result;

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  // Build date filter
  const where: Record<string, unknown> = {};

  if (startDateParam && endDateParam) {
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    // Set end date to end of day to include orders created on the end date
    endDate.setHours(23, 59, 59, 999);

    where.createdAt = { gte: startDate, lte: endDate };
  } else if (startDateParam || endDateParam) {
    // If only one date is provided, require both
    return NextResponse.json(
      { error: "Both startDate and endDate are required for date filtering." },
      { status: 400 }
    );
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      createdAt: true,
      acknowledgedBy: { select: { id: true, name: true } },
      deliveryPartner: { select: { id: true, name: true } },
    },
  });

  const report = orders.map((order: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    createdAt: Date;
    acknowledgedBy: { id: string; name: string | null } | null;
    deliveryPartner: { id: string; name: string | null } | null;
  }) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    acknowledgedByName: order.acknowledgedBy?.name ?? "Unassigned",
    deliveryPartnerName: order.deliveryPartner?.name ?? "Unassigned",
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  return NextResponse.json({ report });
}
