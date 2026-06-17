import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireOwner } from "@/lib/authz";
import { staffUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOwner(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = staffUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid staff update." }, { status: 400 });

  const data = {
    isActive: parsed.data.isActive,
    passwordHash: parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined,
    passwordVersion: parsed.data.password ? { increment: 1 } : undefined
  };
  const staff = await prisma.user.update({ where: { id }, data, select: { id: true, role: true } });
  if (parsed.data.password) await prisma.session.deleteMany({ where: { userId: id } });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: parsed.data.password ? "staff_password_reset" : parsed.data.isActive === false ? "staff_deactivated" : "staff_updated",
    targetType: "User",
    targetId: staff.id,
    metadata: { role: staff.role, isActive: parsed.data.isActive }
  });

  return NextResponse.json({ staff });
}
