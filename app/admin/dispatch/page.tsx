import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Truck, User } from "lucide-react";

export default async function DispatchPage() {
  const result = await requirePermission("dispatch.view");
  if ("error" in result) redirect("/admin");

  // Fetch orders ready for or out for delivery
  const orders = await prisma.order.findMany({
    where: { status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      deliveryPartner: { select: { id: true, name: true, phone: true } },
    },
  });

  // Available delivery partners
  const partners = await prisma.user.findMany({
    where: { role: "DELIVERY_PARTNER", isActive: true },
    select: { id: true, name: true, phone: true, currentLatitude: true, currentLongitude: true, locationUpdatedAt: true },
  });

  const statusColors: Record<string, string> = {
    READY_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
    OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-700",
    ARRIVING: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">Dispatch</h1>
        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{orders.length} active</span>
      </div>

      {/* Partners available */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Delivery Partners ({partners.length})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl bg-slate-50 p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">{p.phone}</p>
              </div>
              {p.locationUpdatedAt && (
                <span className="ml-auto text-[10px] text-slate-400">
                  {new Date(p.locationUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          ))}
          {partners.length === 0 && <p className="text-sm text-slate-400 col-span-full">No delivery partners available</p>}
        </div>
      </section>

      {/* Active deliveries */}
      <section className="space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
            <p className="text-sm text-slate-400">No orders ready for dispatch</p>
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="block rounded-xl bg-white border border-slate-200 p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">#{order.orderNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || ""}`}>{order.status.replace(/_/g, " ")}</span>
                </div>
                <span className="text-xs text-slate-500">{Number(order.distanceKm).toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {order.customerName}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.phone}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.street}</span>
              </div>
              {order.deliveryPartner ? (
                <p className="mt-2 text-xs font-semibold text-primary">Assigned: {order.deliveryPartner.name}</p>
              ) : (
                <p className="mt-2 text-xs font-semibold text-orange-600">Unassigned</p>
              )}
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
