import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireOrderStaff } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";
import { deliveryAssignmentSchema } from "@/lib/validations";

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = deliveryAssignmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid delivery assignment." }, { status: 400 });

  const order = await prisma.order.update({
    where: { id },
    data: {
      deliveryPartnerId: parsed.data.deliveryPartnerId,
      deliveryOtp: parsed.data.deliveryPartnerId ? createOtp() : null
    },
    select: { id: true, deliveryOtp: true, userId: true, orderNumber: true }
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "delivery_assigned",
    targetType: "Order",
    targetId: id,
    metadata: { deliveryPartnerId: parsed.data.deliveryPartnerId }
  });
  if (parsed.data.deliveryPartnerId) {
    await sendPushToUser(order.userId, {
      title: "Delivery partner assigned",
      body: `Order #${order.orderNumber} is ready for delivery. Your OTP is ${order.deliveryOtp}.`,
      url: "/dashboard",
      orderId: id
    });
  }

  return NextResponse.json({ order });
}
