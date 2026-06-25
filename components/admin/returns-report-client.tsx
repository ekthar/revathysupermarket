"use client";

import { useState } from "react";
import { ChevronDown, Printer } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

type ReturnItem = {
  orderItemId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount?: number;
};

type ReturnEntry = {
  id: string;
  returnNumber: string;
  status: string;
  refundAmount: number | null;
  refundMethod: string | null;
  createdAt: string;
  reason: string | null;
  items: unknown;
  order: {
    orderNumber: string;
    customerName: string;
    total: number;
  };
};

type DayGroup = {
  date: string;
  returns: ReturnEntry[];
  total: number;
  count: number;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrencyPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getReturnItems(items: unknown): ReturnItem[] {
  if (Array.isArray(items)) return items as ReturnItem[];
  return [];
}

function buildPrintHtml(days: DayGroup[], title: string): string {
  const sections = days
    .map((day) => {
      const itemRows = day.returns
        .flatMap((ret) => {
          const items = getReturnItems(ret.items);
          return items.map((item) => ({
            name: item.name ?? "Item",
            quantity: item.quantity ?? 0,
            amount: Number(item.amount ?? Number(item.price ?? 0) * Number(item.quantity ?? 0)),
            customer: ret.order.customerName,
            orderNumber: ret.order.orderNumber,
            reason: (ret.reason ?? "").replaceAll("_", " "),
          }));
        })
        .map(
          (row) =>
            `<tr>
              <td style="padding:10px 8px;border-bottom:1px solid #f0ebe0;font-size:13px;color:#1e293b;">${escapeHtml(row.name)}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #f0ebe0;font-size:13px;text-align:center;color:#1e293b;">${row.quantity}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #f0ebe0;font-size:13px;text-align:right;font-weight:700;color:#1e293b;">${escapeHtml(formatCurrencyPlain(row.amount))}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #f0ebe0;font-size:13px;color:#1e293b;">${escapeHtml(row.customer)}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #f0ebe0;font-size:13px;color:#1e293b;">#${escapeHtml(row.orderNumber)}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #f0ebe0;font-size:12px;color:#64748b;">${escapeHtml(row.reason)}</td>
            </tr>`
        )
        .join("");

      return `
        <div style="margin-bottom:32px;break-inside:avoid;">
          <div style="background:#f8f5ed;border-radius:12px;padding:12px 16px;margin-bottom:12px;">
            <h3 style="font-size:16px;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(formatDateDisplay(day.date))}</h3>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0 0;">${day.count} return${day.count !== 1 ? "s" : ""}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:2px solid #dbe7d2;">
                <th style="padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;text-align:left;">Item</th>
                <th style="padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;text-align:center;">Qty</th>
                <th style="padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;text-align:right;">Amount</th>
                <th style="padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;text-align:left;">Customer</th>
                <th style="padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;text-align:left;">Order #</th>
                <th style="padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;text-align:left;">Reason</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="margin-top:12px;background:#0F8A5F;border-radius:14px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;font-weight:900;color:#ffffff;">Day Total Refund</span>
            <span style="font-size:18px;font-weight:900;color:#ffffff;">${escapeHtml(formatCurrencyPlain(day.total))}</span>
          </div>
        </div>`;
    })
    .join("");

  const grandTotal = days.reduce((sum, d) => sum + d.total, 0);

  return `<!DOCTYPE html>
<html>
<head>
<title>${escapeHtml(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { margin: 16mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #fffaf0;
    padding: 32px;
    color: #1e293b;
  }
  .card {
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 24px;
    border: 2px solid #dbe7d2;
    padding: 32px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }
</style>
</head>
<body>
  <div class="card">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#0F8A5F;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:22px;font-weight:900;color:#ffffff;">RS</span>
      </div>
      <div>
        <h1 style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">REVATHY SUPERMARKET</h1>
        <p style="font-size:13px;color:#64748b;margin-top:2px;">${escapeHtml(title)}</p>
      </div>
    </div>
    <hr style="border:none;border-top:2px solid #dbe7d2;margin-bottom:24px;" />
    ${sections}
    <div style="margin-top:24px;background:#0F8A5F;border-radius:18px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:16px;font-weight:900;color:#ffffff;">Grand Total Refunds</span>
      <span style="font-size:22px;font-weight:900;color:#ffffff;">${escapeHtml(formatCurrencyPlain(grandTotal))}</span>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

export function ReturnsReportClient({ dailyData }: { dailyData: DayGroup[] }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  function toggleExpand(date: string) {
    setExpandedDate((prev) => (prev === date ? null : date));
  }

  function printDay(day: DayGroup) {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const html = buildPrintHtml([day], `Returns Report - ${formatDateDisplay(day.date)}`);
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function printAll() {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const html = buildPrintHtml(dailyData, "Returns Report - Last 30 Days");
    printWindow.document.write(html);
    printWindow.document.close();
  }

  if (dailyData.length === 0) return null;

  return (
    <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-black">Per-day item breakdown</h2>
        <button
          type="button"
          onClick={printAll}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-4 text-xs font-black hover:bg-muted"
        >
          <Printer className="h-4 w-4" />
          Print All (30 days)
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {dailyData.map((day) => {
          const isExpanded = expandedDate === day.date;
          return (
            <div
              key={day.date}
              className="overflow-hidden rounded-2xl border border-border/50"
            >
              {/* Expandable header */}
              <button
                type="button"
                onClick={() => toggleExpand(day.date)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                  <span className="text-sm font-bold">
                    {formatDateDisplay(day.date)}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {day.count} return{day.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-sm font-black text-red-600 dark:text-red-400">
                  - {formatCurrency(day.total)}
                </span>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 px-4 py-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="pb-2 pr-3 font-black">Item</th>
                              <th className="pb-2 pr-3 font-black">Qty</th>
                              <th className="pb-2 pr-3 text-right font-black">Amount</th>
                              <th className="pb-2 pr-3 font-black">Customer</th>
                              <th className="pb-2 pr-3 font-black">Order #</th>
                              <th className="pb-2 font-black">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.returns.flatMap((ret) => {
                              const items = getReturnItems(ret.items);
                              return items.map((item, idx) => (
                                <tr
                                  key={`${ret.id}-${idx}`}
                                  className="border-b border-border/30"
                                >
                                  <td className="py-2 pr-3 font-medium">
                                    {item.name ?? "Item"}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {item.quantity ?? 0}
                                  </td>
                                  <td className="py-2 pr-3 text-right font-bold">
                                    {formatCurrency(
                                      Number(
                                        item.amount ??
                                          Number(item.price ?? 0) *
                                            Number(item.quantity ?? 0)
                                      )
                                    )}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {ret.order.customerName}
                                  </td>
                                  <td className="py-2 pr-3">
                                    #{ret.order.orderNumber}
                                  </td>
                                  <td className="py-2 text-muted-foreground">
                                    {(ret.reason ?? "").replaceAll("_", " ")}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => printDay(day)}
                          className="inline-flex h-9 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-black hover:bg-muted"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print Daily Report
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
