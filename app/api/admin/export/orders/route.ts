import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireReportStaff } from "@/lib/authz";
import { calculateInclusiveGst } from "@/lib/billing";
import { getStoreSettingsForApi } from "@/lib/store-settings";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await auth();
  const unauthorized = requireReportStaff(session);
  if (unauthorized) return unauthorized;

  const [orders, settings] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } }),
    getStoreSettingsForApi()
  ]);

  const rows = [
    ["Order Number", "Customer", "Phone", "Status", "Payment Method", "Payment Status", "Total", "Taxable Value", "GST Amount", "CGST", "SGST", "Items", "Address", "Created At"],
    ...orders.map((order) => {
      const total = Number(order.total);
      // Calculate aggregate GST from items (per-item rates) or fall back to global
      let taxableValue = 0;
      let gstAmount = 0;
      for (const item of order.items) {
        const itemAmount = Number(item.price) * item.quantity;
        const itemRate = item.gstRate !== null ? Number(item.gstRate) : settings.gstRatePercent;
        const itemGst = calculateInclusiveGst(itemAmount, itemRate);
        taxableValue += itemGst.taxableValue;
        gstAmount += itemGst.gstAmount;
      }
      return [
        order.orderNumber,
        order.customerName,
        order.phone,
        order.status,
        order.paymentMethod,
        order.paymentStatus,
        total.toFixed(2),
        taxableValue.toFixed(2),
        gstAmount.toFixed(2),
        (gstAmount / 2).toFixed(2),
        (gstAmount / 2).toFixed(2),
        order.items.map((item) => `${item.name} x ${item.quantity} @${Number(item.price)}`).join("; "),
        `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        order.createdAt.toISOString()
      ];
    })
  ];

  return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=orders.csv"
    }
  });
}
