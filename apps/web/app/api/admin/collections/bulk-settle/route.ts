import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";

export async function POST(request: Request) {
  const result = await requirePermission("collections.manage");
  if ("error" in result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { collectionIds, cashAmount, upiAmount } = body as {
    collectionIds: string[];
    cashAmount: number;
    upiAmount: number;
  };

  if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
    return NextResponse.json({ error: "No collections selected" }, { status: 400 });
  }

  if ((cashAmount || 0) <= 0 && (upiAmount || 0) <= 0) {
    return NextResponse.json({ error: "Enter a cash or UPI amount" }, { status: 400 });
  }

  try {
    await prisma.deliveryCollection.updateMany({
      where: { id: { in: collectionIds }, status: { not: "SETTLED" } },
      data: {
        status: "SETTLED",
        cashCollected: cashAmount || 0,
        upiCollected: upiAmount || 0,
        reconciledAt: new Date(),
        reconciledById: result.ctx.userId,
      },
    });

    return NextResponse.json({ success: true, count: collectionIds.length });
  } catch (error) {
    console.error("[bulk-settle]", error);
    return NextResponse.json({ error: "Bulk settlement failed" }, { status: 500 });
  }
}
