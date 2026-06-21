import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { CollectionsClient } from "@/components/admin/collections-client";

export default async function CollectionsPage() {
  const result = await requirePermission("collections.view");
  if ("error" in result) redirect("/admin");

  const collections = await prisma.deliveryCollection.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: { select: { orderNumber: true, customerName: true, total: true } },
      partner: { select: { id: true, name: true, phone: true } },
      reconciledBy: { select: { name: true } },
    },
  });

  // Group by status
  const grouped = {
    pending: collections.filter((c) => c.status === "PENDING_HANDOVER"),
    upiPending: collections.filter((c) => c.status === "UPI_AWAITING_VERIFICATION"),
    settled: collections.filter((c) => c.status === "SETTLED"),
    discrepancy: collections.filter((c) => c.status === "SHORT" || c.status === "EXCESS"),
  };

  const totals = {
    pendingCash: grouped.pending.reduce((sum, c) => sum + Number(c.cashCollected), 0),
    pendingUpi: grouped.upiPending.reduce((sum, c) => sum + Number(c.upiCollected), 0),
    settledTotal: grouped.settled.reduce((sum, c) => sum + Number(c.cashCollected) + Number(c.upiCollected), 0),
    discrepancyCount: grouped.discrepancy.length,
  };

  const plain = collections.map((entry) => ({ ...entry, expectedAmount: Number(entry.expectedAmount), cashCollected: Number(entry.cashCollected), upiCollected: Number(entry.upiCollected), walletApplied: Number(entry.walletApplied), adjustmentAmount: Number(entry.adjustmentAmount), createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString(), reconciledAt: entry.reconciledAt?.toISOString() ?? null, order: { ...entry.order, total: Number(entry.order.total) } }));
  const ids = new Map(plain.map((entry) => [entry.id, entry]));
  const plainGrouped = { pending: grouped.pending.map((entry) => ids.get(entry.id)!), upiPending: grouped.upiPending.map((entry) => ids.get(entry.id)!), settled: grouped.settled.map((entry) => ids.get(entry.id)!), discrepancy: grouped.discrepancy.map((entry) => ids.get(entry.id)!) };
  return <CollectionsClient collections={plain} grouped={plainGrouped} totals={totals} />;
}
