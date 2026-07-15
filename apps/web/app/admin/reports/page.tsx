import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ReportsTimeSelector } from "@/components/admin/reports-time-selector";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [orders, popularItems, deliveryPartners] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: today } },
      select: { paymentMethod: true, paymentStatus: true, total: true, status: true }
    }).catch(() => []),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 12
    }).catch(() => []),
    prisma.user.findMany({
      where: { role: "DELIVERY_PARTNER" },
      select: {
        id: true,
        name: true,
        phone: true,
        assignedOrders: {
          where: { status: "DELIVERED" },
          select: { id: true, total: true }
        }
      }
    }).catch(() => [])
  ]);
  const cod = orders.filter((order) => order.paymentMethod === "COD").reduce((sum, order) => sum + Number(order.total), 0);
  const upi = orders.filter((order) => order.paymentMethod === "UPI_ON_DELIVERY").reduce((sum, order) => sum + Number(order.total), 0);
  const paid = orders.filter((order) => order.paymentStatus === "PAID").reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <main className="grid gap-5">
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Local reports</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sales, collections, delivery performance, and product popularity. Select a time range to compare.</p>
      </section>

      {/* Time-range aware metrics */}
      <ReportsTimeSelector todayData={{ orders: orders.length, cod, upi, paid }} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
          <h2 className="font-display text-2xl font-black">Product popularity</h2>
          <div className="mt-4 grid gap-2">
            {popularItems.length > 0 ? popularItems.map((item) => (
              <div key={item.name} className="flex justify-between rounded-2xl bg-muted p-3 text-sm font-bold">
                <span>{item.name}</span>
                <span>{item._sum.quantity ?? 0} sold</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No sales data yet.</p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
          <h2 className="font-display text-2xl font-black">Delivery partner performance</h2>
          <div className="mt-4 grid gap-2">
            {deliveryPartners.length > 0 ? deliveryPartners.map((partner) => (
              <div key={partner.id} className="flex justify-between rounded-2xl bg-muted p-3 text-sm font-bold">
                <span>{partner.name ?? partner.phone ?? "Delivery partner"}</span>
                <span>{partner.assignedOrders.length} delivered</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No delivery partners found.</p>
            )}
          </div>
        </section>
      </div>
      <div className="flex flex-wrap gap-3">
        <a href="/api/admin/export/orders" className="inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-sm font-black text-white">
          Download orders CSV
        </a>
        <Link href="/admin/reports/cancelled" className="inline-flex h-11 items-center rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-5 text-sm font-black text-red-700 dark:text-red-300">
          Cancelled Orders Report
        </Link>
        <Link href="/admin/reports/returns" className="inline-flex h-11 items-center rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-5 text-sm font-black text-amber-700 dark:text-amber-300">
          Daily Returns Report
        </Link>
        <Link href="/admin/reports/collections" className="inline-flex h-11 items-center rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-5 text-sm font-black text-blue-700 dark:text-blue-300">
          Staff Collection Verification
        </Link>
        <Link href="/admin/reports/staff" className="inline-flex h-11 items-center rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 px-5 text-sm font-black text-indigo-700 dark:text-indigo-300">
          Staff-Wise Order Report
        </Link>
      </div>
    </main>
  );
}
