import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryAppClient } from "@/components/delivery/delivery-app-client";
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
    prisma.order.count({
      where: { deliveryPartnerId: userId, status: "DELIVERED", updatedAt: { gte: today } }
    }),
    prisma.deliveryCollection.aggregate({
      where: { partnerId: userId, createdAt: { gte: today } },
      _sum: { cashCollected: true, upiCollected: true }
    }),
    prisma.order.count({
      where: { deliveryPartnerId: userId, status: "DELIVERED" }
    })
  ]);

  const todayCash = Number(todayEarnings._sum?.cashCollected ?? 0);
  const todayUpi = Number(todayEarnings._sum?.upiCollected ?? 0);

  return (
    <main className="mx-auto max-w-lg pb-8">
      <DeliveryAlertListener partnerId={userId} />
      <DeliveryAppClient
        partnerName={session.user.name ?? "Partner"}
        stats={{
          todayDelivered,
          todayCashCollected: todayCash,
          todayUpiCollected: todayUpi,
          totalDelivered,
          activeOrders: orders.length
        }}
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
          status: order.status,
          total: Number(order.total),
          paymentMethod: order.paymentMethod,
          items: order.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, price: Number(item.price) })),
          collection: order.deliveryCollection ? {
            expectedAmount: Number(order.deliveryCollection.expectedAmount),
            cashCollected: Number(order.deliveryCollection.cashCollected),
            upiCollected: Number(order.deliveryCollection.upiCollected),
            upiReference: order.deliveryCollection.upiReference,
            status: order.deliveryCollection.status
          } : null
        }))}
      />
    </main>
  );
}
