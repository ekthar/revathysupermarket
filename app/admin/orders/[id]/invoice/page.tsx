/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { gstBusinessName } from "@/lib/billing";
import { getStoreSettings } from "@/lib/store-settings";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!order) notFound();
  const settings = await getStoreSettings();
  const logoSetting = await prisma.setting.findUnique({ where: { key: "logoUrl" } }).catch(() => null);
  const logoUrl = logoSetting?.value || null;

  // Calculate per-item GST breakdown
  const itemsWithGst = order.items.map((item) => {
    const lineTotal = Number(item.price) * item.quantity;
    const gstRate = item.gstRate ? Number(item.gstRate) : settings.gstRatePercent;
    const taxableValue = gstRate > 0 ? lineTotal / (1 + gstRate / 100) : lineTotal;
    const gstAmount = lineTotal - taxableValue;
    return {
      ...item,
      lineTotal,
      gstRate,
      taxableValue,
      gstAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2
    };
  });

  const totalTaxable = itemsWithGst.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalGst = itemsWithGst.reduce((sum, item) => sum + item.gstAmount, 0);
  const totalCgst = totalGst / 2;
  const totalSgst = totalGst / 2;
  const hasGst = totalGst > 0;

  // Check if items have different GST rates
  const uniqueRates = [...new Set(itemsWithGst.map((i) => i.gstRate))];
  const hasMultipleRates = uniqueRates.length > 1;

  return (
    <main className="mx-auto max-w-3xl bg-white px-6 py-10 text-slate-900 print:px-4 print:py-6">
      {/* Header */}
      <div className="flex justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt={settings.storeName} className="h-12 w-12 rounded-lg object-contain" />}
            <h1 className="font-display text-3xl font-black">{settings.storeName}</h1>
          </div>
          <p className="mt-1 text-sm">{settings.address}</p>
          <p className="text-sm">{settings.phone}</p>
          {settings.gstin && <p className="text-sm font-medium">GSTIN: {settings.gstin}</p>}
          {settings.gstBusinessName && <p className="text-sm">Business: {gstBusinessName(settings)}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Tax Invoice</p>
          <p className="text-2xl font-black">#{order.orderNumber}</p>
          <p className="text-sm">{statusLabels[order.status]}</p>
          <p className="mt-1 text-xs text-slate-500">{order.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
      </div>

      {/* Customer/Address */}
      <section className="grid gap-6 border-b py-6 md:grid-cols-2">
        <div>
          <h2 className="font-bold">Customer</h2>
          <p className="mt-2">{order.customerName}</p>
          <p>{order.phone}</p>
        </div>
        <div>
          <h2 className="font-bold">Delivery address</h2>
          <p className="mt-2">{order.houseName}, {order.street}</p>
          <p>{order.landmark}, {order.pincode}</p>
          <p>{Number(order.distanceKm).toFixed(2)} KM from store</p>
        </div>
      </section>

      {/* Items Table with GST */}
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="py-3 px-2">Item</th>
            <th className="py-3 px-2 text-center">Qty</th>
            <th className="py-3 px-2 text-right">Rate</th>
            {hasGst && <th className="py-3 px-2 text-right">GST %</th>}
            {hasGst && <th className="py-3 px-2 text-right">GST Amt</th>}
            <th className="py-3 px-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {itemsWithGst.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-3 px-2">{item.name}</td>
              <td className="py-3 px-2 text-center">{item.quantity}</td>
              <td className="py-3 px-2 text-right">{formatCurrency(Number(item.price))}</td>
              {hasGst && <td className="py-3 px-2 text-right">{item.gstRate}%</td>}
              {hasGst && <td className="py-3 px-2 text-right">{formatCurrency(item.gstAmount)}</td>}
              <td className="py-3 px-2 text-right">{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* GST Summary */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 rounded-xl bg-slate-50 p-4">
          {hasGst && (
            <>
              <div className="flex justify-between text-sm">
                <span>Taxable value</span>
                <span>{formatCurrency(totalTaxable)}</span>
              </div>
              {hasMultipleRates ? (
                <>
                  {uniqueRates.filter((r) => r > 0).map((rate) => {
                    const rateItems = itemsWithGst.filter((i) => i.gstRate === rate);
                    const rateCgst = rateItems.reduce((s, i) => s + i.cgst, 0);
                    const rateSgst = rateItems.reduce((s, i) => s + i.sgst, 0);
                    return (
                      <div key={rate} className="mt-1">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>CGST @ {rate / 2}%</span>
                          <span>{formatCurrency(rateCgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>SGST @ {rate / 2}%</span>
                          <span>{formatCurrency(rateSgst)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="mt-1 flex justify-between text-sm">
                    <span>CGST @ {uniqueRates[0] / 2}%</span>
                    <span>{formatCurrency(totalCgst)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span>SGST @ {uniqueRates[0] / 2}%</span>
                    <span>{formatCurrency(totalSgst)}</span>
                  </div>
                </>
              )}
              <div className="mt-1 flex justify-between text-sm font-semibold border-t border-slate-200 pt-1">
                <span>Total GST</span>
                <span>{formatCurrency(totalGst)}</span>
              </div>
            </>
          )}
          <div className={`flex justify-between font-black ${hasGst ? "mt-3 border-t border-slate-300 pt-3" : ""}`}>
            <span>Grand Total</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Payment: {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod === "WALLET" ? "Wallet" : "UPI on Delivery"}
          </p>
          {hasGst && (
            <p className="mt-1 text-xs text-slate-400">All prices are inclusive of GST</p>
          )}
        </div>
      </div>

      {/* Print button */}
      <div className="mt-8 text-center print:hidden">
        <PrintButton />
      </div>
    </main>
  );
}
