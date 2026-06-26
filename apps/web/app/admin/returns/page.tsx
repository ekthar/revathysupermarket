import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageReturns } from "@/lib/authz";
import { AdminReturnsClient } from "@/components/admin/admin-returns-client";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  const session = await auth();
  if (!canManageReturns(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Returns</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manager or owner access is required.</p>
      </div>
    );
  }

  const returns = await prisma.returnRequest.findMany({
    include: { order: { select: { orderNumber: true, customerName: true, paymentMethod: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  }).catch(() => []);

  return (
    <AdminReturnsClient
      returns={returns.map((entry) => ({
        id: entry.id,
        returnNumber: entry.returnNumber,
        billNumber: entry.billNumber,
        orderNumber: entry.order.orderNumber,
        customerName: entry.order.customerName,
        paymentMethod: entry.order.paymentMethod,
        status: entry.status,
        reason: entry.reason,
        note: entry.note,
        refundAmount: Number(entry.refundAmount ?? 0),
        items: entry.items,
        createdAt: entry.createdAt.toISOString()
      }))}
    />
  );
}
