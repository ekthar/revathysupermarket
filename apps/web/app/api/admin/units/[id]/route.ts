import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id },
  });

  if (!unit) {
    return NextResponse.json({ error: "Unit not found." }, { status: 404 });
  }

  // Verify if any products are using this unit name
  const productCount = await prisma.product.count({
    where: { unit: unit.name },
  });

  if (productCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete "${unit.name}" — it is currently assigned to ${productCount} product(s). Edit the products first.`,
      },
      { status: 400 }
    );
  }

  await prisma.unit.delete({
    where: { id },
  });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "unit_deleted",
    targetType: "Unit",
    targetId: id,
    metadata: { name: unit.name },
  });

  return NextResponse.json({ success: true });
}
