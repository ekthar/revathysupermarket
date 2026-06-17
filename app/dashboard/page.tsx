import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CustomerOrdersClient, type CustomerOrder } from "@/components/dashboard/customer-orders-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const orders = session?.user?.id
    ? await prisma.order.findMany({
        where: { userId: session.user.id },
        include: {
          items: true,
          deliveryPartner: {
            select: {
              currentLatitude: true,
              currentLongitude: true,
              locationUpdatedAt: true
            }
          },
          editLogs: {
            where: { requiresCustomerApproval: true, customerDecision: null },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              action: true,
              originalItem: true,
              newItem: true,
              priceDelta: true,
              reason: true,
              createdAt: true
            }
          },
          statusEvents: { orderBy: { createdAt: "asc" } }
        },
        orderBy: { createdAt: "desc" }
      })
    : [];
  const plainOrders: CustomerOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    editApprovalStatus: order.editApprovalStatus,
    deliveryOtp: order.deliveryOtp,
    latitude: Number(order.latitude),
    longitude: Number(order.longitude),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price)
    })),
    deliveryPartnerLocation: order.deliveryPartner?.currentLatitude && order.deliveryPartner.currentLongitude ? {
      latitude: Number(order.deliveryPartner.currentLatitude),
      longitude: Number(order.deliveryPartner.currentLongitude),
      updatedAt: order.deliveryPartner.locationUpdatedAt?.toISOString()
    } : null,
    editLogs: order.editLogs.map((log) => ({
      id: log.id,
      action: log.action,
      originalItem: log.originalItem,
      newItem: log.newItem,
      priceDelta: Number(log.priceDelta),
      reason: log.reason,
      createdAt: log.createdAt.toISOString()
    }))
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Order tracking</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">My orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Follow every order from received to delivered.</p>
      </section>
      <div className="mt-6">
        <CustomerOrdersClient initialOrders={plainOrders} />
      </div>
    </main>
  );
}
