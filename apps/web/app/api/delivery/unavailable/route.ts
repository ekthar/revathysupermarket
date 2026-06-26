import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { authenticateDeliveryPartnerRequest } from "@/lib/hybrid-auth";
import { sendPushToUser } from "@/lib/push";

const schema = z.object({ orderId: z.string().min(1) });

export async function POST(request: Request) {
  const authResult = await authenticateDeliveryPartnerRequest(request);
  if (!authResult) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const limit = await enforceRateLimit(`delivery:unavailable:${authResult.userId}`, 10, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid order ID is required.", code: "INVALID_INPUT", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { orderId } = parsed.data;

  // Check if order is already in CUSTOMER_UNAVAILABLE state (idempotency)
  const existingUnavailable = await prisma.order.findFirst({ where: { id: orderId, deliveryPartnerId: authResult.userId, status: "CUSTOMER_UNAVAILABLE" } });
  if (existingUnavailable) {
    const waitUntil = existingUnavailable.customerUnavailableAt
      ? new Date(existingUnavailable.customerUnavailableAt.getTime() + (existingUnavailable.customerUnavailableTimeout ?? 300) * 1000).toISOString()
      : new Date(Date.now() + 300000).toISOString();
    return NextResponse.json({ ok: true, waitUntil });
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, deliveryPartnerId: authResult.userId, status: { in: ["ARRIVING"] } } });
  if (!order) return NextResponse.json({ error: "Active assigned order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });

  const now = new Date();
  const timeoutSeconds = 300;
  await prisma.order.update({ where: { id: order.id }, data: { status: "CUSTOMER_UNAVAILABLE", customerUnavailableAt: now, customerUnavailableTimeout: timeoutSeconds } });
  await prisma.orderEvent.create({ data: { orderId: order.id, status: "CUSTOMER_UNAVAILABLE" } });

  if (order.userId) {
    await sendPushToUser(order.userId, { title: "Delivery partner waiting", body: "Your delivery partner is waiting. Please respond within 5 minutes or the order will be returned to store.", url: "/dashboard", orderId: order.id }).catch(() => null);
  }

  return NextResponse.json({ ok: true, waitUntil: new Date(now.getTime() + timeoutSeconds * 1000).toISOString() });
}
