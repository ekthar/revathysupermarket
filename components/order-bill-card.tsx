"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";

type BillData = {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: "COD" | "UPI_ON_DELIVERY";
    status: keyof typeof statusLabels;
    total: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number; price: number; amount: number }>;
  };
  store: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
    gstBusinessName: string;
    gstRatePercent: number;
  };
  gst: {
    rate: number;
    taxableValue: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
  };
};

export function OrderBillCard({ orderId }: { orderId: string }) {
  const { showToast } = useToast();
  const [bill, setBill] = useState<BillData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadBill() {
      const response = await fetch(`/api/orders/${orderId}/bill`, { cache: "no-store" });
      const data = await readApiResponse<BillData & { error?: string }>(response);
      if (!active) return;
      if (!response.ok) {
        setError(data.error ?? "Bill could not be loaded.");
        return;
      }
      setBill(data);
    }
    loadBill();
    return () => {
      active = false;
    };
  }, [orderId]);

  const summary = useMemo(() => {
    if (!bill) return "";
    return [
      `Revathy Supermarket bill #${bill.order.orderNumber}`,
      `Customer: ${bill.order.customerName}`,
      `Total: ${formatCurrency(bill.order.total)}`,
      `Payment: ${bill.order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI on Delivery"}`,
      `Status: ${statusLabels[bill.order.status]}`
    ].join("\n");
  }, [bill]);

  function downloadImage() {
    if (!bill) return;
    const rows = bill.order.items
      .map((item, index) => `<text x="52" y="${330 + index * 34}" font-size="18" fill="#1e293b">${escapeXml(item.name)} x ${item.quantity}</text><text x="685" y="${330 + index * 34}" font-size="18" font-weight="700" fill="#1e293b" text-anchor="end">${escapeXml(formatCurrency(item.amount))}</text>`)
      .join("");
    const height = Math.max(720, 430 + bill.order.items.length * 34);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="740" height="${height}" viewBox="0 0 740 ${height}">
      <rect width="740" height="${height}" rx="38" fill="#fffaf0"/>
      <rect x="28" y="28" width="684" height="${height - 56}" rx="30" fill="#ffffff" stroke="#dbe7d2" stroke-width="2"/>
      <circle cx="92" cy="96" r="34" fill="#0F8A5F"/><text x="92" y="105" text-anchor="middle" font-size="25" font-weight="900" fill="#ffffff">RS</text>
      <text x="142" y="84" font-size="28" font-weight="900" fill="#0f172a">REVATHY SUPERMARKET</text>
      <text x="142" y="116" font-size="15" fill="#64748b">${escapeXml(bill.store.address)}</text>
      <text x="52" y="178" font-size="20" font-weight="900" fill="#0f172a">Order #${escapeXml(bill.order.orderNumber)}</text>
      <text x="52" y="210" font-size="15" fill="#64748b">${escapeXml(bill.order.customerName)} | ${escapeXml(bill.order.phone)}</text>
      <text x="52" y="238" font-size="15" fill="#64748b">${escapeXml(bill.order.address)}</text>
      <line x1="52" y1="285" x2="688" y2="285" stroke="#dbe7d2" stroke-width="2"/>
      ${rows}
      <line x1="52" y1="${height - 250}" x2="688" y2="${height - 250}" stroke="#dbe7d2" stroke-width="2"/>
      <text x="52" y="${height - 206}" font-size="17" fill="#64748b">Taxable value</text><text x="685" y="${height - 206}" font-size="17" fill="#1e293b" text-anchor="end">${escapeXml(formatCurrency(bill.gst.taxableValue))}</text>
      <text x="52" y="${height - 174}" font-size="17" fill="#64748b">CGST + SGST (${bill.gst.rate}%)</text><text x="685" y="${height - 174}" font-size="17" fill="#1e293b" text-anchor="end">${escapeXml(formatCurrency(bill.gst.gstAmount))}</text>
      <rect x="52" y="${height - 135}" width="636" height="72" rx="22" fill="#0F8A5F"/>
      <text x="82" y="${height - 90}" font-size="22" font-weight="900" fill="#ffffff">Total</text><text x="658" y="${height - 90}" font-size="26" font-weight="900" fill="#ffffff" text-anchor="end">${escapeXml(formatCurrency(bill.order.total))}</text>
    </svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `revathy-${bill.order.orderNumber}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Bill image downloaded", "success");
  }

  async function copySummary() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    showToast("Bill summary copied", "success");
  }

  if (error) return <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p>;
  if (!bill) return <div className="mt-4 h-80 animate-pulse rounded-[1.75rem] bg-muted" />;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-5 overflow-hidden rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(180deg,#fffaf0,#ffffff)] p-4 text-slate-800 shadow-premium dark:border-white/10 dark:bg-none dark:bg-card dark:text-slate-100"
    >
      <div className="rounded-[1.35rem] bg-primary p-4 text-white">
        <p className="text-xs font-black uppercase text-lime-fresh">Order bill</p>
        <h3 className="mt-1 font-display text-2xl font-black">#{bill.order.orderNumber}</h3>
        <p className="mt-1 text-sm text-white/80">{statusLabels[bill.order.status]}</p>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-200">
        <div>
          <p className="font-black text-slate-950 dark:text-white">{bill.store.name}</p>
          <p>{bill.store.address}</p>
          {bill.store.gstin && <p>GSTIN: {bill.store.gstin}</p>}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.08]">
          <p className="font-black text-slate-950 dark:text-white">{bill.order.customerName}</p>
          <p>{bill.order.phone}</p>
          <p>{bill.order.address}</p>
        </div>
        <div className="grid gap-2">
          {bill.order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.07]">
              <span className="font-bold">{item.name} x {item.quantity}</span>
              <span className="font-black">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.08]">
          <div className="flex justify-between"><span>Taxable value</span><span>{formatCurrency(bill.gst.taxableValue)}</span></div>
          {bill.gst.rate > 0 && (
            <>
              <div className="mt-1 flex justify-between"><span>CGST</span><span>{formatCurrency(bill.gst.cgst)}</span></div>
              <div className="mt-1 flex justify-between"><span>SGST</span><span>{formatCurrency(bill.gst.sgst)}</span></div>
            </>
          )}
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-950 dark:border-white/10 dark:text-white">
            <span>Total</span>
            <span>{formatCurrency(bill.order.total)}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={downloadImage}><Download className="h-4 w-4" /> Image</Button>
        <Button type="button" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> PDF/Print</Button>
        <Button type="button" variant="outline" onClick={copySummary}><Copy className="h-4 w-4" /> Copy</Button>
      </div>
    </motion.section>
  );
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
