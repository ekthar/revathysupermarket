import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { AdminStaffClient } from "@/components/admin/admin-staff-client";

export const dynamic = "force-dynamic";
export default async function StaffPage() {
  const permission = await requirePermission("staff.manage");
  if ("error" in permission) redirect("/admin");
  const staff = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF", "DELIVERY_PARTNER"] } }, select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLoginAt: true, vehicleInfo: true, staffPermissions: { select: { permission: true } } }, orderBy: { createdAt: "desc" } });
  return <AdminStaffClient staff={staff.map((member) => ({ ...member, permissions: member.staffPermissions.map((entry) => entry.permission), lastLoginAt: member.lastLoginAt?.toISOString() ?? null }))} />;
}
