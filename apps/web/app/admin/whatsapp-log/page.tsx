import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied, AdminPageShell, AdminDataTable, AdminStatusBadge } from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/AdminDataTable";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = { sent: "info", delivered: "success", failed: "error" } as const;

interface Props { searchParams: Promise<{ status?: string }> }

export default async function AdminWhatsAppLogPage({ searchParams }: Props) {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "marketing.view")) {
    return <AdminAccessDenied permission="marketing.view" />;
  }

  const params = await searchParams;
  const statusFilter = params.status && ["sent", "delivered", "failed"].includes(params.status) ? params.status : undefined;

  const logs = await prisma.whatsAppLog.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  type LogRow = (typeof logs)[number];

  const columns: Column<LogRow>[] = [
    { key: "phone", label: "Phone", render: (l) => (
      <span className="font-medium text-neutral-900 dark:text-neutral-100">{l.phone}</span>
    )},
    { key: "template", label: "Template", render: (l) => (
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{l.template}</span>
    )},
    { key: "status", label: "Status", render: (l) => (
      <AdminStatusBadge
        label={l.status.charAt(0).toUpperCase() + l.status.slice(1)}
        variant={STATUS_VARIANT[l.status as keyof typeof STATUS_VARIANT] || "neutral"}
      />
    )},
    { key: "messageId", label: "Message ID", hideOnMobile: true, render: (l) => (
      <span className="font-mono text-xs text-neutral-400">{l.messageId || "—"}</span>
    )},
    { key: "createdAt", label: "Time", render: (l) => (
      <span className="text-xs text-neutral-500">
        {new Date(l.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </span>
    )},
  ];

  return (
    <AdminPageShell
      eyebrow="Marketing"
      title="WhatsApp Log"
      variant="green"
      breadcrumbs={[{ label: "Marketing" }, { label: "WhatsApp Log" }]}
      actions={
        <div className="flex items-center gap-1.5">
          {(["all", "sent", "delivered", "failed"] as const).map((s) => {
            const isActive = s === "all" ? !statusFilter : statusFilter === s;
            return (
              <a
                key={s}
                href={s === "all" ? "/admin/whatsapp-log" : `/admin/whatsapp-log?status=${s}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? "bg-white text-neutral-900 shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </a>
            );
          })}
        </div>
      }
    >
      <AdminDataTable
        columns={columns}
        data={logs}
        getRowKey={(l) => l.id}
        emptyState={{ title: "No messages logged", description: "WhatsApp notifications will appear here once sent." }}
      />
    </AdminPageShell>
  );
}
