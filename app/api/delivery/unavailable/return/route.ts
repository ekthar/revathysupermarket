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

  const limit = await enforceRateLimit(`delivery:return:${authResult.userId}`, 10, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid order ID is required.", code: "INVALID_INPUT", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { orderId } = parsed.data;

  const order = await prisma.order.findFirst({ where: { id: orderId, deliveryPartnerId: authResult.userId, status: "CUSTOMER_UNAVAILABLE" } });
  if (!order) return NextResponse.json({ error: "Order not found or not in unavailable state.", code: "ORDER_NOT_FOUND" }, { status: 404 });

  const waitSeconds = order.customerUnavailableTimeout ?? 300;
  const elapsed = order.customerUnavailableAt ? (Date.now() - order.customerUnavailableAt.getTime()) / 1000 : 0;
  if (elapsed < waitSeconds) {
    const remainingSeconds = Math.ceil(waitSeconds - elapsed);
    return NextResponse.json({ error: "Waiting period not elapsed", remainingSeconds }, { status: 409 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "RETURNED_TO_STORE" } });
  await prisma.orderEvent.create({ data: { orderId: order.id, status: "RETURNED_TO_STORE", note: "Customer unavailable. Order returned to store." } });

  if (order.userId) {
    await sendPushToUser(order.userId, { title: "Order returned to store", body: "Your order has been returned to the store because you were unavailable. Please contact support for re-delivery.", url: "/dashboard", orderId: order.id }).catch(() => null);
  }

  return NextResponse.json({ ok: true, status: "RETURNED_TO_STORE" });
}
