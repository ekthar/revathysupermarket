import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageStaff } from "@/lib/authz";
import { AdminStaffClient } from "@/components/admin/admin-staff-client";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await auth();
  if (!canManageStaff(session?.user?.role)) {
    return (
      <div className="rounded-[1.75rem] border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Staff</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access is required.</p>
      </div>
    );
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF", "DELIVERY_PARTNER"] } },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLoginAt: true, vehicleInfo: true },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  return (
    <AdminStaffClient
      staff={staff.map((member) => ({
        ...member,
        lastLoginAt: member.lastLoginAt?.toISOString() ?? null
      }))}
    />
  );
}
