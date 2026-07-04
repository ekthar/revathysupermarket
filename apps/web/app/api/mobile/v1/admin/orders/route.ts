import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/orders
 * Cursor-paginated order list for admin mobile app.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("take") || "50", 10)));

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      printedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = orders.length > take;
  const page = hasMore ? orders.slice(0, take) : orders;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({
    orders: page.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: Number(o.total),
      status: o.status,
      printedAt: o.printedAt?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
    nextCursor,
  });
}
