import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { products } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";
import { AdminCharts } from "@/components/admin/admin-charts";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const canSeeFinancials = canViewReports(session?.user?.role);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayOrders = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  let packingOrders = 0;
  let whatsappMessagesToday = 0;
  let receivedOrders = 0;
  let readyOrders = 0;
  let outForDeliveryOrders = 0;
  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];

  try {
    [todayOrders, pendingOrders, packingOrders, deliveredOrders, whatsappMessagesToday, receivedOrders, readyOrders, outForDeliveryOrders, orders] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: { in: ["ORDER_RECEIVED", "ACCEPTED", "PACKING"] } } }),
      prisma.order.count({ where: { status: "PACKING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.whatsAppLog.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: "ORDER_RECEIVED" } }),
      prisma.order.count({ where: { status: "READY_FOR_DELIVERY" } }),
      prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
      prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 25 })
    ]);
  } catch {
    orders = [];
  }

  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const lowStock = products.filter((product) => product.stock <= 15).slice(0, 6);
  const chartData = [
    { name: "Today", orders: todayOrders, revenue: canSeeFinancials ? revenue : 0 },
    { name: "Pending", orders: pendingOrders, revenue: 0 },
    { name: "Delivered", orders: deliveredOrders, revenue: canSeeFinancials ? revenue * 0.65 : 0 }
  ];

  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Today at a glance</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">Fast order overview for counter and delivery staff.</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Today's Orders", todayOrders],
          ["Pending Orders", pendingOrders],
          ["Packing", packingOrders],
          ["Delivered Orders", deliveredOrders],
          ["WhatsApp Sent", whatsappMessagesToday],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.5rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>
      {canSeeFinancials ? (
        <div className="mt-3 rounded-[1.5rem] border border-white/70 bg-primary p-4 text-white shadow-soft dark:border-white/10">
          <p className="text-xs font-black uppercase text-white/70">Revenue</p>
          <p className="mt-1 text-3xl font-black">{formatCurrency(revenue)}</p>
        </div>
      ) : null}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <AdminCharts data={chartData} />
        <div className="grid gap-5">
          <div className="rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
            <h3 className="font-display text-2xl font-bold">Order funnel</h3>
            <div className="mt-4 grid gap-3">
              {[
                ["Received", receivedOrders],
                ["Packing", packingOrders],
                ["Ready", readyOrders],
                ["Out", outForDeliveryOrders],
                ["Delivered", deliveredOrders]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm font-bold">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
            <h3 className="font-display text-2xl font-bold">Low stock alerts</h3>
            <div className="mt-4 grid gap-3">
              {lowStock.map((product) => (
                <div key={product.id} className="flex justify-between rounded-xl bg-muted p-3 text-sm font-bold">
                  <span>{product.name}</span>
                  <span>{product.stock}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
