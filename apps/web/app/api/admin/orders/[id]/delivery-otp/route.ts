import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireOrderStaff } from "@/lib/authz";
import { createDeliveryOtp, deliveryOtpExpiryDate } from "@/lib/delivery";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";
import { sendPushToUser } from "@/lib/push";
import { writeAuditLog } from "@/lib/audit";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const order = await prisma.order.update({
    where: { id },
    data: {
      deliveryOtp: createDeliveryOtp(),
      deliveryOtpAttempts: 0,
      deliveryOtpExpiresAt: deliveryOtpExpiryDate()
    },
    select: { id: true, orderNumber: true, phone: true, userId: true, deliveryOtp: true, deliveryOtpExpiresAt: true }
  });

  await sendWhatsAppTemplate({
    to: order.phone,
    template: "delivery_assigned",
    params: [order.orderNumber, order.deliveryOtp ?? ""],
    orderId: order.id
  });
  await sendPushToUser(order.userId, {
    title: "Delivery OTP regenerated",
    body: `Order #${order.orderNumber} OTP is ${order.deliveryOtp}.`,
    url: "/dashboard",
    orderId: id
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "delivery_otp_regenerated",
    targetType: "Order",
    targetId: id
  });

  return NextResponse.json({ order });
}
