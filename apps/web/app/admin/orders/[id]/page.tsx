import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, CreditCard, FileText, MapPin, Package, Phone, RotateCcw, Truck, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requirePermission("orders.view");
  if ("error" in result) return notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, name: true, image: true, slug: true } } } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      deliveryPartner: { select: { id: true, name: true, phone: true } },
      acknowledgedBy: { select: { id: true, name: true } },
      statusEvents: { orderBy: { createdAt: "asc" } },
      editLogs: { orderBy: { createdAt: "desc" }, take: 20, include: { editedBy: { select: { name: true } } } },
      returnRequests: { orderBy: { createdAt: "desc" } },
      supportTickets: { orderBy: { createdAt: "desc" }, take: 5 },
      deliveryCollection: true,
      deliveryAdjustments: { orderBy: { createdAt: "desc" } },
      deliveryLocationEvents: { orderBy: { createdAt: "desc" }, take: 1 },
      feedback: true,
      deliverySlot: true,
    },
  });

  if (!order) return notFound();

  const statusColors: Record<string, string> = {
    ORDER_RECEIVED: "bg-yellow-100 text-yellow-800",
    AWAITING_CUSTOMER_APPROVAL: "bg-orange-100 text-orange-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    PACKING: "bg-purple-100 text-purple-800",
    READY_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
    OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-800",
    ARRIVING: "bg-teal-100 text-teal-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Order #{order.orderNumber}</h1>
            <p className="text-xs text-slate-500">Placed {new Date(order.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {order.printedAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              ✓ Printed {new Date(order.printedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Link
            href={`/admin/orders/${order.id}/invoice`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Print Invoice
          </Link>
          <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${statusColors[order.status] || "bg-slate-100 text-slate-800"}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer & Address */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Customer</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{order.customerName}</p>
                <p className="text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {order.phone}</p>
                {order.user?.email && <p className="text-slate-500 text-xs">{order.user.email}</p>}
              </div>
              <div>
                <p className="text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery Address</p>
                <p className="font-medium text-slate-800">{order.houseName}, {order.street}</p>
                <p className="text-slate-500">{order.landmark} - {order.pincode}</p>
                <p className="text-xs text-slate-400 mt-1">{Number(order.distanceKm).toFixed(1)} km away</p>
              </div>
            </div>
            {order.notes && <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">Note: {order.notes}</p>}
          </section>

          {/* Order Items */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Items ({order.items.length})</h2>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-600">{item.quantity}x</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      {item.gstRate && <p className="text-micro text-slate-400">GST: {Number(item.gstRate)}%</p>}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">₹{(Number(item.price) * item.quantity).toFixed(0)}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">₹{Number(order.subtotal).toFixed(0)}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-green-600">Discount</span><span className="font-semibold text-green-600">-₹{Number(order.discount).toFixed(0)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="font-semibold">{Number(order.deliveryFee) === 0 ? "FREE" : `₹${Number(order.deliveryFee).toFixed(0)}`}</span></div>
              <div className="flex justify-between text-base pt-1 border-t border-slate-100"><span className="font-black">Total</span><span className="font-black text-primary">₹{Number(order.total).toFixed(0)}</span></div>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Timeline</h2>
            <div className="space-y-3">
              {order.statusEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ev.status.replace(/_/g, " ")}</p>
                    {ev.note && <p className="text-xs text-slate-500">{ev.note}</p>}
                    <p className="text-micro text-slate-400">{new Date(ev.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Returns */}
          {order.returnRequests.length > 0 && (
            <section className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> Returns ({order.returnRequests.length})</h2>
              <div className="space-y-3">
                {order.returnRequests.map((ret) => (
                  <div key={ret.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{ret.returnNumber}</span>
                      <span className={`text-micro font-bold px-2 py-0.5 rounded-full ${ret.status === "REFUNDED" ? "bg-green-100 text-green-700" : ret.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{ret.status}</span>
                    </div>
                    <p className="text-xs text-slate-600">{ret.reason}</p>
                    {ret.refundAmount && <p className="text-xs font-semibold text-green-600 mt-1">Refund: ₹{Number(ret.refundAmount).toFixed(0)}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column - Sidebar cards */}
        <div className="space-y-5">
          {/* Payment */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="font-semibold">{order.paymentMethod.replace(/_/g, " ")}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`font-semibold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}>{order.paymentStatus}</span></div>
            </div>
          </section>

          {/* Delivery Slot */}
          {order.deliverySlot && (
            <section className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900 mb-3">Delivery Slot</h2>
              <p className="text-sm font-semibold text-slate-800">{new Date(order.deliverySlot.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} - {new Date(order.deliverySlot.endsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</p>
              <p className="text-xs text-slate-500">{order.deliveryMode}</p>
            </section>
          )}

          {/* Driver Assignment */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Delivery</h2>
            {order.deliveryPartner ? (
              <div className="text-sm">
                <p className="font-semibold text-slate-800">{order.deliveryPartner.name}</p>
                <p className="text-slate-500">{order.deliveryPartner.phone}</p>
                {order.deliveryOtp && <p className="mt-2 text-xs font-mono bg-slate-50 rounded-lg px-3 py-2">OTP: <span className="font-bold text-primary">{order.deliveryOtp}</span></p>}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Not assigned yet</p>
            )}
          </section>

          {/* Collection */}
          {order.deliveryCollection && (
            <section className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900 mb-3">Collection</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Expected</span><span className="font-semibold">₹{Number(order.deliveryCollection.expectedAmount).toFixed(0)}</span></div>
                {Number(order.deliveryCollection.cashCollected) > 0 && <div className="flex justify-between"><span className="text-slate-500">Cash</span><span className="font-semibold">₹{Number(order.deliveryCollection.cashCollected).toFixed(0)}</span></div>}
                {Number(order.deliveryCollection.upiCollected) > 0 && <div className="flex justify-between"><span className="text-slate-500">UPI</span><span className="font-semibold">₹{Number(order.deliveryCollection.upiCollected).toFixed(0)}</span></div>}
                <div className="flex justify-between pt-1 border-t"><span className="text-slate-500">Status</span><span className="font-bold text-xs">{order.deliveryCollection.status.replace(/_/g, " ")}</span></div>
              </div>
            </section>
          )}

          {/* Doorstep Adjustments */}
          {order.deliveryAdjustments.length > 0 && (
            <section className="rounded-2xl bg-white border border-orange-200 p-5">
              <h2 className="text-sm font-black text-orange-800 mb-3">Doorstep Adjustments</h2>
              <div className="space-y-2">
                {order.deliveryAdjustments.map((adj) => (
                  <div key={adj.id} className="text-xs">
                    <p className="font-semibold text-slate-800">{adj.itemName} × {adj.quantity}</p>
                    <p className="text-slate-500">{adj.reason}</p>
                    <p className="font-bold text-orange-600">-₹{Number(adj.reductionAmount).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Feedback */}
          {order.feedback && (
            <section className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900 mb-3">Customer Feedback</h2>
              <div className="flex gap-4 text-sm">
                <div><p className="text-slate-500 text-xs">Order</p><p className="font-bold">{"⭐".repeat(order.feedback.orderRating)}</p></div>
                <div><p className="text-slate-500 text-xs">Delivery</p><p className="font-bold">{"⭐".repeat(order.feedback.deliveryRating)}</p></div>
              </div>
              {order.feedback.comment && <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{order.feedback.comment}</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
