import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireReportStaff } from "@/lib/authz";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await auth();
  const unauthorized = requireReportStaff(session);
  if (unauthorized) return unauthorized;

  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  const rows = [
    ["Order Number", "Customer", "Phone", "Status", "Payment Method", "Payment Status", "Total", "Items", "Address", "Created At"],
    ...orders.map((order) => [
      order.orderNumber,
      order.customerName,
      order.phone,
      order.status,
      order.paymentMethod,
      order.paymentStatus,
      order.total,
      order.items.map((item) => `${item.name} x ${item.quantity}`).join("; "),
      `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
      order.createdAt.toISOString()
    ])
  ];

  return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=revathy-orders.csv"
    }
  });
}
