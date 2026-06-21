import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-guard";
import { validatePermissionsForRole, isHighRisk, type PermissionKey, type StaffRole } from "@/lib/permissions";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireOwner();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { permissions } = body as { permissions: PermissionKey[] };

  // Fetch the target user
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, authVersion: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Staff not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Cannot modify owner permissions
  if (targetUser.role === "OWNER") {
    return NextResponse.json({ error: "Cannot modify owner permissions", code: "FORBIDDEN" }, { status: 403 });
  }

  // Validate permissions for role ceiling
  const role = targetUser.role as StaffRole;
  const { valid, rejected } = validatePermissionsForRole(role, permissions);
  if (!valid) {
    return NextResponse.json({ error: `Permissions not allowed for ${role}: ${rejected.join(", ")}`, code: "PERMISSION_CEILING" }, { status: 400 });
  }

  // Check high-risk (only owner)
  const highRiskRequested = permissions.filter((p) => isHighRisk(p));
  if (highRiskRequested.length > 0 && result.ctx.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can grant high-risk permissions", code: "HIGH_RISK_DENIED" }, { status: 403 });
  }

  // Replace all permissions atomically + bump authVersion to invalidate sessions
  await prisma.$transaction(async (tx) => {
    await tx.staffPermission.deleteMany({ where: { userId: id } });
    if (permissions.length > 0) {
      await tx.staffPermission.createMany({
        data: permissions.map((p) => ({ userId: id, permission: p, grantedBy: result.ctx.userId })),
      });
    }
    await tx.user.update({
      where: { id },
      data: { authVersion: { increment: 1 } },
    });
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: result.ctx.userId,
      actorRole: result.ctx.role,
      action: "staff.permissions.update",
      targetType: "User",
      targetId: id,
      metadata: { permissions, previousVersion: targetUser.authVersion },
    },
  });

  return NextResponse.json({ success: true, permissions });
}
