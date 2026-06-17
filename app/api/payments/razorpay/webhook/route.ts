import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderNumber = body?.payload?.payment?.entity?.notes?.orderNumber ?? body?.orderNumber;
  const paymentId = body?.payload?.payment?.entity?.id ?? body?.paymentId;
  const status = body?.event === "payment.failed" ? "FAILED" : "PAID";

  if (!orderNumber || !paymentId) {
    return NextResponse.json({ error: "Webhook payload missing order reference." }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { orderNumber },
    data: { paymentStatus: status, paymentGatewayRef: paymentId }
  });
  await writeAuditLog({
    actorRole: "SYSTEM",
    action: "payment_webhook_received",
    targetType: "Order",
    targetId: order.id,
    metadata: { orderNumber, paymentId, status }
  });

  return NextResponse.json({ ok: true });
}
