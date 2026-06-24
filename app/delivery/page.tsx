import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryAppShell } from "@/components/delivery/delivery-app-shell";
import { DeliveryAlertListener } from "@/components/delivery/delivery-alert-listener";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, todayDelivered, todayEarnings, totalDelivered] = await Promise.all([
    prisma.order.findMany({
      where: { deliveryPartnerId: userId, status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] } },
      include: { items: true, deliveryCollection: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.count({ where: { deliveryPartnerId: userId, status: "DELIVERED", updatedAt: { gte: today } } }),
    prisma.deliveryCollection.aggregate({
      where: { partnerId: userId, createdAt: { gte: today } },
      _sum: { cashCollected: true, upiCollected: true }
    }),
    prisma.order.count({ where: { deliveryPartnerId: userId, status: "DELIVERED" } })
  ]);

  return (
    <main className="mx-auto max-w-lg min-h-dvh bg-slate-50 dark:bg-slate-950 pb-8">
      <DeliveryAlertListener partnerId={userId} />
      <DeliveryAppShell
        partnerName={session.user.name ?? "Partner"}
        stats={{
          todayDelivered,
          todayCash: Number(todayEarnings._sum?.cashCollected ?? 0),
          todayUpi: Number(todayEarnings._sum?.upiCollected ?? 0),
          totalDelivered,
          activeOrders: orders.length
        }}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          phone: o.phone,
          address: `${o.houseName}, ${o.street}, ${o.landmark}, ${o.pincode}`,
          status: o.status,
          total: Number(o.total),
          paymentMethod: o.paymentMethod,
          items: o.items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: Number(i.price) })),
          collection: o.deliveryCollection ? {
            expectedAmount: Number(o.deliveryCollection.expectedAmount),
            cashCollected: Number(o.deliveryCollection.cashCollected),
            upiCollected: Number(o.deliveryCollection.upiCollected),
            upiReference: o.deliveryCollection.upiReference,
            status: o.deliveryCollection.status
          } : null
        }))}
      />
    </main>
  );
}
