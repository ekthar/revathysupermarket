import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Phone, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerOrderHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!canViewReports(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manager or owner access is required to view customer order history.
        </p>
      </div>
    );
  }

  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true },
  });

  if (!customer) return notFound();

  const [orders, aggregates] = await Promise.all([
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: { userId: id },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  const statusColors: Record<string, string> = {
    ORDER_RECEIVED: "bg-yellow-100 text-yellow-800",
    AWAITING_CUSTOMER_APPROVAL: "bg-orange-100 text-orange-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    PACKING: "bg-purple-100 text-purple-800",
    READY_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
    OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-800",
    ARRIVING: "bg-teal-100 text-teal-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Customer Header */}
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Customer history</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">
          {customer.name ?? "Customer"}
        </h1>
        {customer.phone && (
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {customer.phone}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:w-fit">
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-card/95 p-3 shadow-soft dark:border-white/10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-lg font-black">{aggregates._count}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-card/95 p-3 shadow-soft dark:border-white/10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Spend</p>
              <p className="text-lg font-black">
                {formatCurrency(Number(aggregates._sum.total ?? 0))}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Order List */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-black">Order History</h2>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">No orders found for this customer.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="group rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft transition-colors hover:border-primary/30 hover:bg-primary/5 dark:border-white/10"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-foreground">
                        Order #{order.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <span
                      className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <p className="text-sm font-black">
                      {formatCurrency(Number(order.total))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
