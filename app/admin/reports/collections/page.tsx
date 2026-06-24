import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StaffCollectionVerificationPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !["OWNER", "MANAGER", "ADMIN"].includes(role)) {
    return (
      <div className="rounded-[1.75rem] border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Collection Verification</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner/Manager access required.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all delivery collections for today with partner info
  const collections = await prisma.deliveryCollection.findMany({
    where: { createdAt: { gte: today } },
    include: {
      partner: { select: { id: true, name: true, phone: true } },
      order: { select: { orderNumber: true, customerName: true, paymentMethod: true, total: true } }
    },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  // Group by delivery partner
  type CollectionEntry = (typeof collections)[number];
  const byPartner = new Map<string, {
    partner: { id: string; name: string | null; phone: string | null };
    collections: CollectionEntry[];
    totalExpected: number;
    totalCash: number;
    totalUpi: number;
    totalCollected: number;
    shortfall: number;
    excess: number;
    pendingCount: number;
    settledCount: number;
  }>();

  for (const col of collections) {
    const key = col.partnerId;
    if (!byPartner.has(key)) {
      byPartner.set(key, {
        partner: col.partner,
        collections: [],
        totalExpected: 0,
        totalCash: 0,
        totalUpi: 0,
        totalCollected: 0,
        shortfall: 0,
        excess: 0,
        pendingCount: 0,
        settledCount: 0
      });
    }
    const group = byPartner.get(key)!;
    group.collections.push(col);
    const expected = Number(col.expectedAmount);
    const cash = Number(col.cashCollected);
    const upi = Number(col.upiCollected);
    const adj = Number(col.adjustmentAmount);
    const collected = cash + upi;

    group.totalExpected += expected - adj;
    group.totalCash += cash;
    group.totalUpi += upi;
    group.totalCollected += collected;

    const diff = collected - (expected - adj);
    if (diff < -0.5) group.shortfall += Math.abs(diff);
    if (diff > 0.5) group.excess += diff;

    if (col.status === "SETTLED") group.settledCount++;
    else group.pendingCount++;
  }

  const partnerData = Array.from(byPartner.values());
  const grandExpected = partnerData.reduce((sum, p) => sum + p.totalExpected, 0);
  const grandCollected = partnerData.reduce((sum, p) => sum + p.totalCollected, 0);
  const grandShortfall = partnerData.reduce((sum, p) => sum + p.shortfall, 0);

  return (
    <main className="grid gap-5">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.12))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Staff verification</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Collection Verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">Verify staff and delivery partner cash/UPI collections against expected amounts.</p>
      </section>

      {/* Summary cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
          <p className="text-xs font-black uppercase text-muted-foreground">Total Expected</p>
          <p className="mt-2 text-2xl font-black">{formatCurrency(grandExpected)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4 shadow-soft dark:border-emerald-800 dark:bg-emerald-950/20">
          <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Total Collected</p>
          <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(grandCollected)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50/80 p-4 shadow-soft dark:border-red-800 dark:bg-red-950/20">
          <p className="text-xs font-black uppercase text-red-700 dark:text-red-400">Shortfall</p>
          <p className="mt-2 text-2xl font-black text-red-800 dark:text-red-300">{formatCurrency(grandShortfall)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
          <p className="text-xs font-black uppercase text-muted-foreground">Deliveries Today</p>
          <p className="mt-2 text-2xl font-black">{collections.length}</p>
        </div>
      </div>

      {/* Per-partner breakdown */}
      {partnerData.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">
          <p className="font-bold text-muted-foreground">No collections recorded today.</p>
        </div>
      ) : (
        partnerData.map((data) => (
          <section key={data.partner.id} className="rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-black">{data.partner.name ?? "Delivery Partner"}</h2>
                <p className="text-xs text-muted-foreground">{data.partner.phone}</p>
              </div>
              <div className="text-right">
                {data.shortfall > 0.5 ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    Short ₹{Math.round(data.shortfall)}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Balanced
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Expected</p>
                <p className="mt-1 font-black">{formatCurrency(data.totalExpected)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Cash</p>
                <p className="mt-1 font-black">{formatCurrency(data.totalCash)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground">UPI</p>
                <p className="mt-1 font-black">{formatCurrency(data.totalUpi)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-bold">{data.settledCount} settled / {data.pendingCount} pending</p>
              </div>
            </div>

            {/* Individual orders */}
            <div className="mt-3 divide-y divide-border/50">
              {data.collections.map((col) => (
                <div key={col.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-bold">#{col.order.orderNumber}</span>
                    <span className="ml-2 text-muted-foreground">{col.order.customerName}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${col.status === "SETTLED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : col.status === "SHORT" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                      {col.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{formatCurrency(Number(col.cashCollected) + Number(col.upiCollected))}</span>
                    <span className="text-muted-foreground"> / {formatCurrency(Number(col.expectedAmount))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <a href="/admin/reports" className="inline-flex h-11 w-fit items-center rounded-2xl border border-border px-5 text-sm font-black">
        ← Back to Reports
      </a>
    </main>
  );
}
