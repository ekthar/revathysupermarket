import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireReportStaff } from "@/lib/authz";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// Date-range filter is required to prevent unbounded queries.
// If no `from`/`to` query params are provided, defaults to the last 90 days.
export async function GET(request: NextRequest) {
  const session = await auth();
  const unauthorized = requireReportStaff(session);
  if (unauthorized) return unauthorized;

  const { searchParams } = request.nextUrl;
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const fromDate = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : defaultFrom;
  const toDate = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : now;

  // Validate parsed dates
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return new Response(JSON.stringify({ error: "Invalid date range. Use ISO format: ?from=2024-01-01&to=2024-03-31" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Order Number", "Customer", "Phone", "Status", "Payment Method", "Payment Status", "Total", "Items", "Address", "Created At"];

  // Stream the CSV response to avoid holding all rows in memory at once
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(header.map(csvCell).join(",") + "\n"));
      for (const order of orders) {
        const row = [
          order.orderNumber,
          order.customerName,
          order.phone,
          order.status,
          order.paymentMethod,
          order.paymentStatus,
          order.total,
          order.items.map((item) => `${item.name} x ${item.quantity}`).join("; "),
          `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
          order.createdAt.toISOString(),
        ];
        controller.enqueue(encoder.encode(row.map(csvCell).join(",") + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=msm-orders.csv",
    },
  });
}
