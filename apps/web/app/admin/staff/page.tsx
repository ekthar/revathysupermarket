import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { AdminAccessDenied } from "@/components/admin/shared";
import { AdminStaffClient } from "@/components/admin/admin-staff-client";

export const dynamic = "force-dynamic";

const STAFF_ROLES: Role[] = [
  Role.ADMIN,
  Role.OWNER,
  Role.MANAGER,
  Role.STAFF,
  Role.PACKING_STAFF,
  Role.DELIVERY_PARTNER,
];

export default async function AdminStaffPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "staff.manage")) {
    return <AdminAccessDenied permission="staff.manage" />;
  }

  const staffMembers = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      vehicleInfo: true,
      staffPermissions: { select: { permission: true } },
    },
  }).catch(() => []);

  const serialized = staffMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    role: m.role,
    isActive: m.isActive,
    lastLoginAt: m.lastLoginAt?.toISOString() || null,
    vehicleInfo: m.vehicleInfo || null,
    permissions: m.staffPermissions.map((p) => p.permission),
  }));

  return <AdminStaffClient staff={serialized} />;
}
