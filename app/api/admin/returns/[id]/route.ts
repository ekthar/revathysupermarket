import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireReturnStaff } from "@/lib/authz";
import { returnResolutionSchema } from "@/lib/validations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireReturnStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = returnResolutionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid return resolution." }, { status: 400 });
  if (parsed.data.status === "REJECTED" && !parsed.data.resolutionNote) {
    return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
  }

  const returnRequest = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      refundMethod: parsed.data.refundMethod,
      refundAmount: parsed.data.refundAmount,
      refundReference: parsed.data.refundReference,
      resolutionNote: parsed.data.resolutionNote,
      resolvedById: session?.user?.id,
      resolvedAt: new Date()
    },
    include: { order: true }
  });

  if (parsed.data.status === "REFUNDED" && parsed.data.refundMethod === "WALLET" && returnRequest.order.userId && parsed.data.refundAmount) {
    await prisma.walletTransaction.create({
      data: {
        userId: returnRequest.order.userId,
        orderId: returnRequest.orderId,
        amount: parsed.data.refundAmount,
        type: "credit",
        reason: "Return refund"
      }
    });
  }

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: parsed.data.status === "REFUNDED" ? "refund_issued" : "return_resolved",
    targetType: "ReturnRequest",
    targetId: id,
    metadata: parsed.data
  });

  return NextResponse.json({ returnRequest });
}
