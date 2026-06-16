import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CustomerOrdersClient, type CustomerOrder } from "@/components/dashboard/customer-orders-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const orders = session?.user?.id
    ? await prisma.order.findMany({
        where: { userId: session.user.id },
        include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" }
      })
    : [];
  const plainOrders: CustomerOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price)
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
