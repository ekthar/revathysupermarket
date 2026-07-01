import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateOrderSubtotal } from "@/lib/billing";
import { requirePackingStaff } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";
import { orderEditSchema } from "@/lib/validations";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

const AUTO_APPROVE_DELTA = Number(process.env.ORDER_EDIT_AUTO_APPROVE_DELTA ?? 50);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requirePackingStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = orderEditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid order edit." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(order.status)) {
    return NextResponse.json({ error: "This order can no longer be edited." }, { status: 400 });
  }

  const item = order.items.find((entry) => entry.id === parsed.data.itemId);
  if (!item) return NextResponse.json({ error: "Order item not found." }, { status: 404 });

  const originalItem = {
    id: item.id,
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price)
  };

  let newItem = { ...originalItem };
  if (parsed.data.action === "remove") {
    newItem = { ...newItem, quantity: 0 };
  }
  if (parsed.data.action === "quantity-change") {
    newItem = { ...newItem, quantity: parsed.data.quantity };
  }
  if (parsed.data.action === "substitute") {
    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, isActive: true },
      select: { id: true, name: true, price: true, discountPrice: true }
    });
    if (!product) return NextResponse.json({ error: "Substitute product not found." }, { status: 404 });
    newItem = {
      id: item.id,
      productId: product.id,
      name: product.name,
      quantity: parsed.data.quantity ?? item.quantity,
      price: Number(product.discountPrice ?? product.price)
    };
  }

  const previousTotal = Number(order.total);
  const nextItems = order.items.map((entry) => entry.id === item.id
    ? { price: newItem.price, quantity: newItem.quantity }
    : { price: Number(entry.price), quantity: entry.quantity });
  const nextTotal = calculateOrderSubtotal(nextItems);
  const priceDelta = nextTotal - previousTotal;
  // Substitutions ALWAYS require customer approval regardless of price delta
  const requiresCustomerApproval = parsed.data.action === "substitute" ? true : Math.abs(priceDelta) > AUTO_APPROVE_DELTA;

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        productId: newItem.productId,
        name: newItem.name,
        quantity: newItem.quantity,
        price: newItem.price
      }
    });
    await tx.order.update({
      where: { id },
      data: {
        subtotal: nextTotal,
        total: nextTotal,
        // Always reset approval status when a new edit requires approval,
        // ensuring EVERY substitution triggers its own approval cycle
        status: requiresCustomerApproval ? "AWAITING_CUSTOMER_APPROVAL" : order.status,
        editApprovalStatus: requiresCustomerApproval ? "pending" : (order.editApprovalStatus === "pending" ? "pending" : "not_required"),
        editApprovalRequestedAt: requiresCustomerApproval ? new Date() : order.editApprovalRequestedAt
      }
    });
    await tx.orderEditLog.create({
      data: {
        orderId: id,
        editedById: session?.user?.id,
        action: parsed.data.action,
        originalItem,
        newItem,
        priceDelta,
        reason: parsed.data.reason,
        requiresCustomerApproval
      }
    });
    await tx.auditLog.create({
      data: {
        actorId: session?.user?.id,
        actorRole: session?.user?.role ?? "SYSTEM",
        action: "order_edited",
        targetType: "Order",
        targetId: id,
        metadata: { action: parsed.data.action, originalItem, newItem, priceDelta, requiresCustomerApproval }
      }
    });
  });
  await sendPushToUser(order.userId, {
    title: requiresCustomerApproval ? "Order edit needs approval" : "Order updated",
    body: `${originalItem.name} was updated in order #${order.orderNumber}.`,
    url: "/dashboard",
    orderId: id
  });
  if (requiresCustomerApproval) {
    await sendWhatsAppTemplate({
      to: order.phone,
      template: "order_edited",
      params: [order.orderNumber],
      orderId: id
    });
  }

  return NextResponse.json({ ok: true, priceDelta, requiresCustomerApproval });
}
