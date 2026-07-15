import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CustomerOrdersClient, type CustomerOrder } from "@/components/dashboard/customer-orders-client";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const include = {
    items: { include: { product: { select: { id: true, slug: true, name: true, price: true, discountPrice: true, image: true, stock: true, unit: true, createdAt: true, category: { select: { name: true } } } } } },
    deliveryPartner: { select: { currentLatitude: true, currentLongitude: true, locationUpdatedAt: true } },
    returnRequests: { select: { id: true, returnNumber: true, status: true }, orderBy: { createdAt: "desc" as const }, take: 3 },
    supportTickets: { select: { id: true, ticketNumber: true, status: true }, orderBy: { updatedAt: "desc" as const }, take: 3 },
    editLogs: { where: { requiresCustomerApproval: true, customerDecision: null }, orderBy: { createdAt: "asc" as const }, select: { id: true, action: true, originalItem: true, newItem: true, priceDelta: true, reason: true, createdAt: true } }
  };
  const [activeOrders, completedOrders] = session?.user?.id ? await Promise.all([
    prisma.order.findMany({
        where: { userId: session.user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } }, include,
        orderBy: { createdAt: "desc" }
      }),
    prisma.order.findMany({ where: { userId: session.user.id, status: { in: ["DELIVERED", "CANCELLED"] } }, include, orderBy: { createdAt: "desc" }, take: 10 })
  ]) : [[], []];
  const orders = [...activeOrders, ...completedOrders];
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
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
      product: item.product ? {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        category: item.product.category.name as Product["category"],
        price: Number(item.product.price),
        discountPrice: item.product.discountPrice ? Number(item.product.discountPrice) : undefined,
        image: item.product.image,
        description: "",
        stock: item.product.stock,
        popularity: 0,
        unit: item.product.unit,
        isFeatured: false,
        createdAt: item.product.createdAt.toISOString()
      } : null
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
    })),
    returnRequests: order.returnRequests,
    supportTickets: order.supportTickets
  }));

  return (
    <main className="mx-auto min-h-[100dvh] max-w-7xl bg-background px-4 pb-28 pt-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-xl bg-black p-5 text-white shadow-premium sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-secondary-400">Order tracking</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight tracking-tighter">My orders</h1>
        <p className="mt-2 text-sm font-medium text-white/65">Follow every order from received to delivered.</p>
        <div className="mt-4 flex gap-3">
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-micro text-white/60">Active</p>
            <p className="text-lg font-black">{activeOrders.length}</p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-micro text-white/60">Completed</p>
            <p className="text-lg font-black">{completedOrders.length}</p>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <CustomerOrdersClient initialOrders={plainOrders} initialHistoryCursor={completedOrders.length === 10 ? completedOrders.at(-1)?.id ?? null : null} />
      </div>
    </main>
  );
}
