import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { Phone, Send, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const session = await auth();
  if (!canViewReports(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Customers</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manager or owner access is required.</p>
      </div>
    );
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { orders: true },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  return (
    <div>
      <div className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Customer care</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Customers</h2>
        <p className="mt-2 text-sm text-muted-foreground">Quick contact and order history for repeat shoppers.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {customers.map((customer) => (
          <article key={customer.id} className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <UserRound className="h-5 w-5 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-black">{customer.name ?? "Customer"}</h3>
                <p className="truncate text-sm text-muted-foreground">{customer.email}</p>
                <p className="mt-2 text-sm font-bold">{customer.orders.length} orders</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={`tel:${customer.phone ?? ""}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 text-sm font-black">
                <Phone className="h-4 w-4 text-primary" />
                Call
              </a>
              <a href={`https://wa.me/${(customer.phone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-lime-fresh text-sm font-black text-slate-950">
                <Send className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
