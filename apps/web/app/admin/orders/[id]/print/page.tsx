import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { formatQuantityWithUnit } from "@msm/shared";
import { AutoPrint } from "./auto-print";

export const dynamic = "force-dynamic";

export default async function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { unit: true } } } },
    },
  });
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-white px-6 py-10 text-slate-900 print:px-4 print:py-6">
      <AutoPrint />

      {/* Header */}
      <div className="flex justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-black">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            {" "}
            {order.createdAt.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {statusLabels[order.status] ?? order.status.replace(/_/g, " ")}
          </span>
          {order.billNumber && (
            <p className="mt-2 text-sm font-semibold">Bill #{order.billNumber}</p>
          )}
        </div>
      </div>

      {/* Customer & Address */}
      <section className="grid gap-6 border-b py-6 md:grid-cols-2">
        <div>
          <h2 className="text-xs font-bold uppercase text-slate-500">Customer</h2>
          <p className="mt-1 font-semibold">{order.customerName}</p>
          <p className="text-sm text-slate-600">{order.phone}</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase text-slate-500">Delivery Address</h2>
          <p className="mt-1 font-semibold">{order.houseName}, {order.street}</p>
          <p className="text-sm text-slate-600">{order.landmark}, {order.pincode}</p>
        </div>
      </section>

      {/* Items Table */}
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="py-3 px-2">#</th>
            <th className="py-3 px-2">Item</th>
            <th className="py-3 px-2 text-center">Qty</th>
            <th className="py-3 px-2 text-right">Unit Price</th>
            <th className="py-3 px-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => {
            const lineTotal = Number(item.price) * item.quantity;
            return (
              <tr key={item.id} className="border-b">
                <td className="py-3 px-2 text-slate-500">{idx + 1}</td>
                <td className="py-3 px-2 font-medium">{item.name}</td>
                <td className="py-3 px-2 text-center">
                  {formatQuantityWithUnit(item.quantity, item.product?.unit ?? "pcs")}
                </td>
                <td className="py-3 px-2 text-right">{formatCurrency(Number(item.price))}</td>
                <td className="py-3 px-2 text-right font-semibold">{formatCurrency(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">Discount</span>
              <span className="font-semibold text-green-600">-{formatCurrency(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-600">Delivery Fee</span>
            <span className="font-semibold">
              {Number(order.deliveryFee) === 0 ? "FREE" : formatCurrency(Number(order.deliveryFee))}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-black">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Payment & Bill Info */}
      <section className="mt-6 border-t pt-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Payment Method</span>
            <p className="mt-1 font-semibold">
              {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod === "WALLET" ? "Wallet" : order.paymentMethod === "UPI_ON_DELIVERY" ? "UPI on Delivery" : order.paymentMethod.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Payment Status</span>
            <p className="mt-1 font-semibold">{order.paymentStatus.replace(/_/g, " ")}</p>
          </div>
          {order.billNumber && (
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Bill Number</span>
              <p className="mt-1 font-semibold">{order.billNumber}</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-slate-400 print:mt-6">
        Order #{order.orderNumber} &middot; Printed on {new Date().toLocaleDateString("en-IN")}
      </p>
    </main>
  );
}
