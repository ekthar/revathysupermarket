import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { returnRequestSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { allowedExternalImageUrl } from "@/lib/security";

const RETURN_WINDOW_HOURS = Number(process.env.RETURN_WINDOW_HOURS ?? 24);
const ACTIVE_STATUSES = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "ITEM_RECEIVED"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const limit = await enforceRateLimit(`return:create:${session.user.id}`, 5, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const { id } = await params;
  const parsed = returnRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select valid items and a return reason.", code: "INVALID_RETURN", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, returnRequests: { where: { status: { in: [...ACTIVE_STATUSES] } }, select: { items: true } } }
  });
  if (!order) return NextResponse.json({ error: "Order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.status !== "DELIVERED") return NextResponse.json({ error: "Returns are available after delivery.", code: "ORDER_NOT_DELIVERED" }, { status: 400 });

  const deliveredAt = order.deliveryConfirmedAt ?? order.updatedAt;
  const eligibleUntil = new Date(deliveredAt.getTime() + RETURN_WINDOW_HOURS * 36e5);
  if (eligibleUntil < new Date()) return NextResponse.json({ error: "The return window has closed.", code: "RETURN_WINDOW_CLOSED" }, { status: 400 });

  const alreadyRequested = new Map<string, number>();
  for (const existing of order.returnRequests) {
    for (const item of existing.items as Array<{ orderItemId?: string; quantity?: number }>) {
      if (item.orderItemId) alreadyRequested.set(item.orderItemId, (alreadyRequested.get(item.orderItemId) ?? 0) + Number(item.quantity ?? 0));
    }
  }
  const itemMap = new Map(order.items.map((item) => [item.id, item]));
  const items: Array<{ orderItemId: string; name: string; quantity: number; price: number; amount: number }> = [];
  for (const requested of parsed.data.items) {
    const item = itemMap.get(requested.orderItemId);
    const remaining = item ? item.quantity - (alreadyRequested.get(item.id) ?? 0) : 0;
    if (!item || requested.quantity > remaining) return NextResponse.json({ error: "Some selected quantities are already included in another return.", code: "RETURN_QUANTITY_UNAVAILABLE" }, { status: 409 });
    items.push({ orderItemId: item.id, name: item.name, quantity: requested.quantity, price: Number(item.price), amount: Number(item.price) * requested.quantity });
  }
  const evidenceUrls = parsed.data.photoUrl && allowedExternalImageUrl(parsed.data.photoUrl) ? [parsed.data.photoUrl] : [];
  const maxRefundAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

  const returnRequest = await prisma.returnRequest.create({
    data: { orderId: id, returnNumber, items, reason: parsed.data.reason, photoUrl: evidenceUrls[0] ?? null, evidenceUrls, note: parsed.data.note, refundAmount: maxRefundAmount, maxRefundAmount, eligibleUntil }
  });
  await writeAuditLog({ actorId: session.user.id, actorRole: session.user.role, action: "return_requested", targetType: "ReturnRequest", targetId: returnRequest.id, metadata: { orderId: id, maxRefundAmount } });
  return NextResponse.json({ returnRequest }, { status: 201 });
}
