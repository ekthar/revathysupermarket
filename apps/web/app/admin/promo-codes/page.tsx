import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied, AdminPageShell, AdminDataTable, AdminStatusBadge } from "@/components/admin/shared";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Column } from "@/components/admin/shared/AdminDataTable";

export const dynamic = "force-dynamic";

function getPromoStatus(promo: { isActive: boolean; expiresAt: Date | null; usageLimit: number | null; usedCount: number }) {
  if (!promo.isActive) return { label: "Inactive", variant: "neutral" as const };
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return { label: "Used Up", variant: "warning" as const };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { label: "Expired", variant: "error" as const };
  return { label: "Active", variant: "success" as const };
}

interface Props { searchParams: Promise<{ page?: string }> }

export default async function AdminPromoCodesPage({ searchParams }: Props) {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "marketing.view")) {
    return <AdminAccessDenied permission="marketing.view" />;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;

  const [promos, total] = await Promise.all([
    prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.promoCode.count(),
  ]);

  type PromoRow = (typeof promos)[number];

  const columns: Column<PromoRow>[] = [
    { key: "code", label: "Code", render: (p) => (
      <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">{p.code}</span>
    )},
    { key: "discountValue", label: "Discount", render: (p) => (
      <span className="font-medium">
        {p.discountType === "percentage" ? `${Number(p.discountValue)}%` : `₹${Number(p.discountValue)}`}
      </span>
    )},
    { key: "minimumOrder", label: "Min Order", hideOnMobile: true, render: (p) => (
      <span className="text-neutral-600 dark:text-neutral-400">
        {Number(p.minimumOrder) > 0 ? `₹${Number(p.minimumOrder)}` : "—"}
      </span>
    )},
    { key: "usedCount", label: "Usage", render: (p) => (
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        {p.usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""}
      </span>
    )},
    { key: "status", label: "Status", render: (p) => {
      const s = getPromoStatus(p);
      return <AdminStatusBadge label={s.label} variant={s.variant} />;
    }},
    { key: "expiresAt", label: "Expiry", hideOnMobile: true, render: (p) => (
      <span className="text-xs text-neutral-500">
        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
      </span>
    )},
    { key: "actions", label: "", align: "right", render: (p) => (
      <Link href={`/admin/promo-codes/${p.id}`} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
        Edit
      </Link>
    )},
  ];

  return (
    <AdminPageShell
      eyebrow="Marketing"
      title="Promo Codes"
      variant="green"
      breadcrumbs={[{ label: "Marketing" }, { label: "Promo Codes" }]}
      actions={
        <Link href="/admin/promo-codes/new" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50">
          <Plus className="h-4 w-4" />
          Create Code
        </Link>
      }
    >
      <AdminDataTable
        columns={columns}
        data={promos}
        getRowKey={(p) => p.id}
        emptyState={{ title: "No promo codes yet", description: "Create a promo code to offer discounts.", action: { label: "Create Code", href: "/admin/promo-codes/new" } }}
      />
      {total > pageSize && (
        <div className="mt-4 text-center text-xs text-neutral-500">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </div>
      )}
    </AdminPageShell>
  );
}
