import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const itemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3).max(300),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
});

/**
 * POST /api/mobile/v1/delivery/orders/[id]/damage
 * Report damaged items during delivery.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      deliveryPartnerId: auth.userId,
      status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] },
    },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Active assigned order not found." },
      { status: 404 }
    );
  }

  const adjustments = await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.deliveryAdjustment.create({
        data: {
          orderId: id,
          partnerId: auth.userId,
          itemName: item.name,
          quantity: item.quantity,
          reason: item.reason,
          reductionAmount: 0,
          status: "RECORDED",
        },
      })
    )
  );

  return NextResponse.json({ adjustments }, { status: 201 });
}
