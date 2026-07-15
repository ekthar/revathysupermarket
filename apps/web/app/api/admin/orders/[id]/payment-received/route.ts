import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireOrderStaff } from "@/lib/authz";

const VALID_METHODS = ["UPI", "Cash", "Card"] as const;
type PaymentMethod = (typeof VALID_METHODS)[number];

function isValidPaymentMethod(method: unknown): method is PaymentMethod {
  return typeof method === "string" && VALID_METHODS.includes(method as PaymentMethod);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();

  if (!isValidPaymentMethod(body.method)) {
    return NextResponse.json(
      { error: "Please select a payment method (UPI, Cash, or Card)." },
      { status: 400 }
    );
  }

  const method: PaymentMethod = body.method;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      total: true,
      paymentStatus: true,
      deliveryPartnerId: true,
      deliveryCollection: { select: { id: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json(
      { error: "Payment has already been recorded for this order." },
      { status: 409 }
    );
  }

  const totalAmount = Number(order.total);
  // Card payments are recorded via upiCollected (digital payment field)
  const collectionData = {
    cashCollected: method === "Cash" ? totalAmount : 0,
    upiCollected: method === "UPI" || method === "Card" ? totalAmount : 0,
  };

  // Update order payment status and record collection method
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { paymentStatus: "PAID" },
    });

    // Upsert the delivery collection record with the appropriate method
    if (order.deliveryCollection) {
      await tx.deliveryCollection.update({
        where: { id: order.deliveryCollection.id },
        data: {
          ...collectionData,
          status: "RECONCILED",
          completedAt: new Date(),
        },
      });
    } else if (order.deliveryPartnerId) {
      await tx.deliveryCollection.create({
        data: {
          orderId: id,
          partnerId: order.deliveryPartnerId,
          expectedAmount: totalAmount,
          ...collectionData,
          status: "RECONCILED",
          completedAt: new Date(),
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    paymentStatus: "PAID",
    method,
  });
}
