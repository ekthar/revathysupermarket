import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireOwner } from "@/lib/auth-guard";
import { ROLE_PRESETS, validatePermissionsForRole, isHighRisk, hasFullAccess, type PermissionKey, type StaffRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

export async function GET() {
  const result = await requirePermission("staff.manage");
  if ("error" in result) return result.error;

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "OWNER", "MANAGER", "STAFF", "PACKING_STAFF", "DELIVERY_PARTNER"] } },
    select: {
      id: true, name: true, email: true, phone: true, role: true, isActive: true,
      lastLoginAt: true, createdAt: true,
      staffPermissions: { select: { permission: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const result = await requireOwner();
  if ("error" in result) return result.error;
  const limit = await enforceRateLimit(`admin:staff:${result.ctx.userId}`, 10, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const body = await req.json();
  const { name, email, phone, password, role, permissions, vehicleInfo } = body as {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: StaffRole;
    permissions: PermissionKey[];
    vehicleInfo?: string;
  };

  // Validation
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (!["MANAGER", "STAFF", "PACKING_STAFF", "DELIVERY_PARTNER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role for staff creation", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Validate permissions for role
  const { valid, rejected } = validatePermissionsForRole(role, permissions || []);
  if (!valid) {
    return NextResponse.json({ error: `Permissions not allowed for ${role}: ${rejected.join(", ")}`, code: "PERMISSION_CEILING" }, { status: 400 });
  }

  // Check high-risk permissions (only owner can grant)
  const highRiskRequested = (permissions || []).filter((p) => isHighRisk(p));
  if (highRiskRequested.length > 0 && result.ctx.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can grant high-risk permissions", code: "HIGH_RISK_DENIED" }, { status: 403 });
  }

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use", code: "DUPLICATE_EMAIL" }, { status: 409 });
  }

  // Create staff user
  const passwordHash = await bcrypt.hash(password, 12);
  const finalPermissions = permissions || ROLE_PRESETS[role] || [];

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: role as any,
      isActive: true,
      vehicleInfo: role === "DELIVERY_PARTNER" ? vehicleInfo?.trim() || null : null,
      staffPermissions: {
        create: finalPermissions.map((p) => ({ permission: p, grantedBy: result.ctx.userId })),
      },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: result.ctx.userId,
      actorRole: result.ctx.role,
      action: "staff.create",
      targetType: "User",
      targetId: user.id,
      metadata: { name, email, role, permissionCount: finalPermissions.length },
    },
  });

  return NextResponse.json({ staff: user, user }, { status: 201 });
}
