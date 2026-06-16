import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { statusLabels, orderStatuses } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Order tracking</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">My orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Follow every order from received to delivered.</p>
      </section>
      <div className="mt-6 grid gap-4 sm:gap-6">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <h2 className="font-display text-2xl font-bold">No orders yet</h2>
            <p className="mt-2 text-muted-foreground">Your grocery orders will appear here.</p>
          </div>
        ) : (
          orders.map((order) => {
            const activeIndex = orderStatuses.indexOf(order.status);
            return (
              <article key={order.id} className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold">Order #{order.orderNumber}</h2>
                    <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatCurrency(Number(order.total))}</p>
                    <p className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{statusLabels[order.status]}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-6">
                  {orderStatuses.filter((status) => status !== "CANCELLED").map((status, index) => (
                    <div key={status} className="flex items-center gap-3 md:block">
                      <span className={index <= activeIndex ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-black text-white" : "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-black"}>
                        {index + 1}
                      </span>
                      <p className="mt-0 text-xs font-bold md:mt-2">{statusLabels[status]}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
