import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireOrderStaff } from "@/lib/authz";
import { sendWhatsAppTemplate, type WhatsAppTemplate } from "@/lib/whatsapp-business";

function templateParams(template: string, order: {
  orderNumber: string;
  total: unknown;
  paymentMethod: string;
  deliveryOtp: string | null;
  items: Array<{ id: string }>;
}) {
  if (template === "order_confirmed") return [order.orderNumber, String(order.items.length), Number(order.total).toFixed(2), order.paymentMethod];
  if (template === "order_packed") return [order.orderNumber];
  if (template === "delivery_assigned") return [order.orderNumber, order.deliveryOtp ?? ""];
  if (template === "out_for_delivery") return [order.orderNumber, order.deliveryOtp ?? ""];
  if (template === "delivered") return [order.orderNumber];
  if (template === "order_edited") return [order.orderNumber];
  return null;
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const log = await prisma.whatsAppLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "WhatsApp log not found." }, { status: 404 });
  if (!log.orderId) return NextResponse.json({ error: "Only order messages can be resent from the log." }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: log.orderId },
    select: {
      id: true,
      orderNumber: true,
      phone: true,
      total: true,
      paymentMethod: true,
      deliveryOtp: true,
      items: { select: { id: true } }
    }
  });
  if (!order) return NextResponse.json({ error: "Order not found for this message." }, { status: 404 });

  const paramsForTemplate = templateParams(log.template, order);
  if (!paramsForTemplate) {
    return NextResponse.json({ error: "This template cannot be reconstructed automatically." }, { status: 400 });
  }

  const result = await sendWhatsAppTemplate({
    to: order.phone,
    template: log.template as WhatsAppTemplate,
    params: paramsForTemplate,
    orderId: order.id
  });
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
