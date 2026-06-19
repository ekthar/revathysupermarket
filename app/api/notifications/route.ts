import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { statusLabels } from "@/lib/constants";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: [] });
    }

    // Fetch recent order status events as notifications
    const recentOrders = await prisma.order.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
        statusEvents: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            status: true,
            note: true,
            createdAt: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    }).catch(() => []);

    const notifications = recentOrders.flatMap((order) =>
      order.statusEvents.map((event) => ({
        id: event.id,
        title: `Order #${order.orderNumber}`,
        body: (event.note || statusLabels[event.status as keyof typeof statusLabels] || event.status),
        type: event.status === "DELIVERED" ? "delivery" as const : "order_update" as const,
        read: false,
        createdAt: event.createdAt.toISOString(),
        url: "/dashboard"
      }))
    ).slice(0, 20);

    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}
