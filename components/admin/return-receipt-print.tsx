"use client";

import { Printer } from "lucide-react";

type ReturnItem = { orderItemId?: string; name?: string; quantity?: number; price?: number; amount?: number };

type ReturnEntry = {
  id: string;
  returnNumber?: string;
  billNumber?: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  status: string;
  reason: string;
  note: string | null;
  refundAmount: number;
  items: unknown;
  createdAt: string;
};

export function ReturnReceiptPrintButton({ entry }: { entry: ReturnEntry }) {
  function handlePrint() {
    const items = Array.isArray(entry.items) ? (entry.items as ReturnItem[]) : [];
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html>
<head>
<title>Return Receipt - ${escapeHtml(entry.returnNumber ?? "")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
  .header p { font-size: 11px; color: #555; margin-top: 4px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #777; letter-spacing: 0.5px; margin-bottom: 6px; }
  .detail-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
  .detail-row .label { color: #555; }
  .detail-row .value { font-weight: 600; }
  .items-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .items-table th { font-size: 10px; text-transform: uppercase; color: #777; text-align: left; border-bottom: 1px solid #ddd; padding: 6px 4px; }
  .items-table th:last-child { text-align: right; }
  .items-table td { font-size: 12px; padding: 8px 4px; border-bottom: 1px solid #eee; }
  .items-table td:last-child { text-align: right; font-weight: 600; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 12px; padding-top: 10px; border-top: 2px solid #111; }
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #777; border-top: 1px dashed #ccc; padding-top: 12px; }
  @media print { body { padding: 10px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Return Receipt</h1>
    <p>Revathy Supermarket</p>
  </div>
  <div class="section">
    <div class="section-title">Return Details</div>
    <div class="detail-row"><span class="label">Return No.</span><span class="value">${escapeHtml(entry.returnNumber ?? "-")}</span></div>
    <div class="detail-row"><span class="label">Bill No.</span><span class="value">${escapeHtml(entry.billNumber || entry.orderNumber)}</span></div>
    <div class="detail-row"><span class="label">Order No.</span><span class="value">#${escapeHtml(entry.orderNumber)}</span></div>
    <div class="detail-row"><span class="label">Customer</span><span class="value">${escapeHtml(entry.customerName)}</span></div>
    <div class="detail-row"><span class="label">Date</span><span class="value">${new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
    <div class="detail-row"><span class="label">Reason</span><span class="value">${escapeHtml(entry.reason.replaceAll("_", " "))}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Items Returned</div>
    <table class="items-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${items.map((item) => `<tr><td>${escapeHtml(item.name ?? "Item")}</td><td>${item.quantity ?? 0} x ${formatCurrencyPlain(Number(item.price ?? 0))}</td><td>${formatCurrencyPlain(Number(item.amount ?? Number(item.price ?? 0) * Number(item.quantity ?? 0)))}</td></tr>`).join("")}</tbody>
    </table>
  </div>
  <div class="total-row"><span>Total Refund</span><span>${formatCurrencyPlain(entry.refundAmount)}</span></div>
  <div class="detail-row" style="margin-top: 8px;"><span class="label">Refund Method</span><span class="value">${escapeHtml(entry.paymentMethod || "WALLET")}</span></div>
  <div class="footer">
    <p>Thank you for shopping with us.</p>
    <p style="margin-top: 4px;">This is a computer-generated receipt.</p>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-background px-4 text-xs font-black hover:bg-muted"
    >
      <Printer className="h-4 w-4" />
      Print Receipt
    </button>
  );
}

function formatCurrencyPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
