import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE, statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-white px-6 py-10 text-slate-900">
      <div className="flex justify-between border-b pb-6">
        <div>
          <h1 className="font-display text-3xl font-black">{SITE.name}</h1>
          <p className="mt-1 text-sm">{SITE.address}</p>
          <p className="text-sm">{SITE.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Invoice</p>
          <p className="text-2xl font-black">#{order.orderNumber}</p>
          <p className="text-sm">{statusLabels[order.status]}</p>
        </div>
      </div>
      <section className="grid gap-6 border-b py-6 md:grid-cols-2">
        <div>
          <h2 className="font-bold">Customer</h2>
          <p className="mt-2">{order.customerName}</p>
          <p>{order.phone}</p>
          <p>{order.whatsapp}</p>
        </div>
        <div>
          <h2 className="font-bold">Delivery address</h2>
          <p className="mt-2">{order.houseName}, {order.street}</p>
          <p>{order.landmark}, {order.pincode}</p>
          <p>{Number(order.distanceKm).toFixed(2)} KM from store</p>
        </div>
      </section>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3">Item</th>
            <th className="py-3">Qty</th>
            <th className="py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-3">{item.name}</td>
              <td className="py-3">{item.quantity}</td>
              <td className="py-3 text-right">{formatCurrency(Number(item.price) * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 flex justify-end">
        <div className="w-64 rounded-xl bg-slate-100 p-4">
          <div className="flex justify-between font-black">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
          <p className="mt-2 text-sm">Payment: {order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI on Delivery"}</p>
        </div>
      </div>
    </main>
  );
}
