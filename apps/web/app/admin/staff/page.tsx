import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { AdminAccessDenied, AdminPageShell, AdminEmptyState } from "@/components/admin/shared";
import { Shield, Users, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const STAFF_ROLES: Role[] = [
  Role.ADMIN,
  Role.OWNER,
  Role.MANAGER,
  Role.STAFF,
  Role.PACKING_STAFF,
  Role.DELIVERY_PARTNER,
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
  PACKING_STAFF: "Packing Staff",
  DELIVERY_PARTNER: "Delivery Partner",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  STAFF: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PACKING_STAFF: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERY_PARTNER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

function relativeTime(date: Date | null): string {
  if (!date) return "Never";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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
      _count: { select: { staffPermissions: true } },
    },
  });

  return (
    <AdminPageShell
      eyebrow="Administration"
      title="Staff Members"
      description={`${staffMembers.length} team members`}
      breadcrumbs={[{ label: "Staff" }]}
    >
      {staffMembers.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No staff members"
          description="Staff accounts will appear here once created."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 sm:flex">
            <div className="flex-1 min-w-[160px]">Name</div>
            <div className="w-32">Role</div>
            <div className="w-32">Phone</div>
            <div className="w-24 text-center">Permissions</div>
            <div className="w-28">Last Login</div>
            <div className="w-20 text-center">Status</div>
          </div>

          {/* Table rows */}
          {staffMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-2 border-b border-neutral-100 px-5 py-3.5 last:border-0 dark:border-neutral-800 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Name */}
              <div className="flex-1 min-w-[160px]">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {member.name || "—"}
                </p>
                {member.email && (
                  <p className="text-xs text-neutral-500">{member.email}</p>
                )}
              </div>

              {/* Role */}
              <div className="w-32">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] || "bg-neutral-100 text-neutral-700"}`}
                >
                  {ROLE_LABELS[member.role] || member.role}
                </span>
              </div>

              {/* Phone */}
              <div className="w-32 text-sm text-neutral-600 dark:text-neutral-400">
                {member.phone || "—"}
              </div>

              {/* Permissions */}
              <div className="w-24 text-center">
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <Shield className="h-3 w-3" />
                  {member._count.staffPermissions}
                </span>
              </div>

              {/* Last Login */}
              <div className="w-28">
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <Clock className="h-3 w-3" />
                  {relativeTime(member.lastLoginAt)}
                </span>
              </div>

              {/* Status */}
              <div className="w-20 text-center">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
