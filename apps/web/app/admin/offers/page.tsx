import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied, AdminPageShell, AdminDataTable, AdminStatusBadge } from "@/components/admin/shared";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Column } from "@/components/admin/shared/AdminDataTable";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ page?: string }> }

export default async function AdminOffersPage({ searchParams }: Props) {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "marketing.view")) {
    return <AdminAccessDenied permission="marketing.view" />;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.offer.count(),
  ]);

  type OfferRow = (typeof offers)[number];

  const columns: Column<OfferRow>[] = [
    { key: "title", label: "Title", render: (o) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{o.title}</span>
        {o.badge && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {o.badge}
          </span>
        )}
      </div>
    )},
    { key: "discountType", label: "Type", render: (o) => (
      <span className="capitalize text-neutral-600 dark:text-neutral-400">{o.discountType}</span>
    )},
    { key: "discountValue", label: "Value", render: (o) => (
      <span className="font-semibold">
        {o.discountType === "percentage" ? `${Number(o.discountValue)}% OFF` : `₹${Number(o.discountValue)} OFF`}
      </span>
    )},
    { key: "categoryId", label: "Scope", hideOnMobile: true, render: (o) => (
      <span className="text-xs text-neutral-500">
        {o.productId ? "Product" : o.categoryId ? "Category" : "All"}
      </span>
    )},
    { key: "isActive", label: "Status", render: (o) => (
      <AdminStatusBadge label={o.isActive ? "Active" : "Inactive"} variant={o.isActive ? "success" : "neutral"} />
    )},
    { key: "startsAt", label: "Dates", hideOnMobile: true, render: (o) => (
      <span className="text-xs text-neutral-500">
        {o.startsAt ? new Date(o.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
        {" → "}
        {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "∞"}
      </span>
    )},
    { key: "actions", label: "", align: "right", render: (o) => (
      <Link href={`/admin/offers/${o.id}`} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
        Edit
      </Link>
    )},
  ];

  return (
    <AdminPageShell
      eyebrow="Marketing"
      title="Offers"
      variant="green"
      breadcrumbs={[{ label: "Marketing" }, { label: "Offers" }]}
      actions={
        <Link href="/admin/offers/new" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50">
          <Plus className="h-4 w-4" />
          Add Offer
        </Link>
      }
    >
      <AdminDataTable
        columns={columns}
        data={offers}
        getRowKey={(o) => o.id}
        emptyState={{ title: "No offers yet", description: "Create your first offer to attract customers.", action: { label: "Add Offer", href: "/admin/offers/new" } }}
      />
      {total > pageSize && (
        <div className="mt-4 text-center text-xs text-neutral-500">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </div>
      )}
    </AdminPageShell>
  );
}
