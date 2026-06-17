import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateOrderSubtotal } from "@/lib/billing";
import { writeAuditLog } from "@/lib/audit";
import { customerApprovalSchema } from "@/lib/validations";

type LoggedItem = {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = customerApprovalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.userId !== session.user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "AWAITING_CUSTOMER_APPROVAL") {
    return NextResponse.json({ error: "No approval is pending for this order." }, { status: 400 });
  }

  const pendingLog = await prisma.orderEditLog.findFirst({
    where: { orderId: id, requiresCustomerApproval: true, customerDecision: null },
    orderBy: { createdAt: "desc" }
  });
  if (!pendingLog) return NextResponse.json({ error: "No pending edit found." }, { status: 404 });

  if (parsed.data.decision === "rejected") {
    const original = pendingLog.originalItem as LoggedItem;
    await prisma.orderItem.update({
      where: { id: original.id },
      data: {
        productId: original.productId,
        name: original.name,
        quantity: original.quantity,
        price: original.price
      }
    });
  }

  const refreshedItems = await prisma.orderItem.findMany({ where: { orderId: id } });
  const total = calculateOrderSubtotal(refreshedItems.map((item) => ({ price: Number(item.price), quantity: item.quantity })));

  await prisma.order.update({
    where: { id },
    data: {
      subtotal: total,
      total,
      status: parsed.data.decision === "approved" ? "ACCEPTED" : "ORDER_RECEIVED",
      editApprovalStatus: parsed.data.decision
    }
  });
  await prisma.orderEditLog.update({
    where: { id: pendingLog.id },
    data: { customerDecision: parsed.data.decision, decidedAt: new Date() }
  });
  await writeAuditLog({
    actorId: session.user.id,
    actorRole: session.user.role,
    action: `order_edit_${parsed.data.decision}`,
    targetType: "Order",
    targetId: id,
    metadata: { editLogId: pendingLog.id }
  });

  return NextResponse.json({ ok: true });
}
