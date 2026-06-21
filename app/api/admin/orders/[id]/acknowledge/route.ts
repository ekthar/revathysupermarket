import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requirePackingStaff } from "@/lib/authz";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requirePackingStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const order = await prisma.order.update({
    where: { id },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: session?.user?.id
    },
    select: {
      id: true,
      acknowledgedAt: true,
      acknowledgedById: true
    }
  });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "order_acknowledged",
    targetType: "Order",
    targetId: id
  });

  return NextResponse.json({ order });
}
