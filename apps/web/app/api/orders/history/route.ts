import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const cursor = new URL(request.url).searchParams.get("cursor");
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: { in: ["DELIVERED", "CANCELLED"] } },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
          product: { select: { id: true, slug: true, name: true, image: true } },
        },
      },
      statusEvents: { orderBy: { createdAt: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 11,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = orders.length > 10;
  const page = orders.slice(0, 10);
  return NextResponse.json({
    orders: page.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product ? { id: item.product.id, slug: item.product.slug, name: item.product.name, image: item.product.image } : null,
      })),
      firstStatusEvent: order.statusEvents[0] ?? null,
    })),
    nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
  });
}
