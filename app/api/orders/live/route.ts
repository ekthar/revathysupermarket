import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const orders = await prisma.order.findMany({ where: { userId: session.user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } }, orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, status: true, updatedAt: true, deliveryPartner: { select: { currentLatitude: true, currentLongitude: true, locationUpdatedAt: true } } } });
  return NextResponse.json({ orders: orders.map((order) => ({ id: order.id, orderNumber: order.orderNumber, status: order.status, updatedAt: order.updatedAt.toISOString(), deliveryPartnerLocation: order.deliveryPartner?.currentLatitude && order.deliveryPartner.currentLongitude ? { latitude: Number(order.deliveryPartner.currentLatitude), longitude: Number(order.deliveryPartner.currentLongitude), updatedAt: order.deliveryPartner.locationUpdatedAt?.toISOString() } : null })) });
}
