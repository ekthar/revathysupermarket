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
    const printWindow = window.open("", "_blank", "width=440,height=700");
    if (!printWindow) return;

    const dateStr = new Date(entry.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const html = `<!DOCTYPE html>
<html>
<head>
<title>Return Receipt - ${escapeHtml(entry.returnNumber ?? "")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fffaf0; padding: 24px; display: flex; justify-content: center; }
  .card { background: #ffffff; border: 2px solid #dbe7d2; border-radius: 24px; padding: 32px 28px; max-width: 380px; width: 100%; }
  .store-header { text-align: center; margin-bottom: 20px; }
  .store-logo { width: 56px; height: 56px; background: #0F8A5F; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
  .store-logo span { color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
  .store-name { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0f172a; margin-bottom: 4px; }
  .store-address { font-size: 12px; color: #64748b; }
  .receipt-title { text-align: center; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin: 16px 0; padding: 10px 0; border-top: 2px solid #dbe7d2; border-bottom: 2px solid #dbe7d2; }
  .details { margin-bottom: 16px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 13px; }
  .detail-row .label { color: #64748b; }
  .detail-row .value { font-weight: 700; color: #1e293b; text-align: right; max-width: 55%; }
  .items-section { margin: 16px 0; }
  .items-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table thead th { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: left; padding: 8px 4px; border-bottom: 2px solid #dbe7d2; }
  .items-table thead th:last-child { text-align: right; }
  .items-table tbody td { font-size: 13px; padding: 10px 4px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  .items-table tbody td:last-child { text-align: right; font-weight: 700; }
  .items-table tbody td.qty { color: #64748b; font-size: 12px; }
  .total-bar { background: #0F8A5F; border-radius: 14px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin: 20px 0 12px; }
  .total-bar .total-label { color: #ffffff; font-size: 16px; font-weight: 900; }
  .total-bar .total-amount { color: #ffffff; font-size: 20px; font-weight: 900; }
  .refund-method { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; margin-bottom: 16px; }
  .refund-method .label { color: #64748b; }
  .refund-method .value { font-weight: 700; color: #1e293b; }
  .footer { text-align: center; padding-top: 16px; border-top: 1px dashed #dbe7d2; }
  .footer p { font-size: 12px; color: #94a3b8; }
  .footer p + p { margin-top: 4px; }
  @media print { body { padding: 10px; background: #ffffff; } .card { border: none; padding: 20px; } }
</style>
</head>
<body>
  <div class="card">
    <div class="store-header">
      <div class="store-logo"><span>RS</span></div>
      <div class="store-name">Revathy Supermarket</div>
      <div class="store-address">Fresh groceries delivered to your door</div>
    </div>
    <div class="receipt-title">Return Receipt</div>
    <div class="details">
      <div class="detail-row"><span class="label">Return No.</span><span class="value">${escapeHtml(entry.returnNumber ?? "-")}</span></div>
      <div class="detail-row"><span class="label">Bill No.</span><span class="value">${escapeHtml(entry.billNumber || entry.orderNumber)}</span></div>
      <div class="detail-row"><span class="label">Order No.</span><span class="value">#${escapeHtml(entry.orderNumber)}</span></div>
      <div class="detail-row"><span class="label">Customer</span><span class="value">${escapeHtml(entry.customerName)}</span></div>
      <div class="detail-row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
      <div class="detail-row"><span class="label">Reason</span><span class="value">${escapeHtml(entry.reason.replaceAll("_", " "))}</span></div>
    </div>
    <div class="items-section">
      <table class="items-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>${items.map((item) => `<tr><td>${escapeHtml(item.name ?? "Item")}</td><td class="qty">${item.quantity ?? 0} x ${formatCurrencyPlain(Number(item.price ?? 0))}</td><td>${formatCurrencyPlain(Number(item.amount ?? Number(item.price ?? 0) * Number(item.quantity ?? 0)))}</td></tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="total-bar">
      <span class="total-label">Total Refund</span>
      <span class="total-amount">${formatCurrencyPlain(entry.refundAmount)}</span>
    </div>
    <div class="refund-method">
      <span class="label">Refund Method</span>
      <span class="value">${escapeHtml(entry.paymentMethod || "WALLET")}</span>
    </div>
    <div class="footer">
      <p>Thank you for shopping with us.</p>
      <p>This is a computer-generated receipt.</p>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
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
