import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryOrdersClient } from "@/components/delivery/delivery-orders-client";
import { InstallAppButton } from "@/components/install-app-button";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const session = await auth();
  const orders = session?.user?.id
    ? await prisma.order.findMany({
        where: { deliveryPartnerId: session.user.id, status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] } },
        include: { items: true, deliveryCollection: true },
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5">
        <p className="text-xs font-black uppercase text-primary">Delivery partner</p>
        <h1 className="mt-2 font-display text-4xl font-black">Assigned orders</h1>
        <div className="mt-4 max-w-xs"><InstallAppButton /></div>
      </section>
      <DeliveryOrdersClient
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
          status: order.status,
          total: Number(order.total),
          items: order.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity }))
        }))}
      />
    </main>
  );
}
