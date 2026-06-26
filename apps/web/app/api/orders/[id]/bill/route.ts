import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateInclusiveGst, gstBusinessName } from "@/lib/billing";
import { isStaffRole } from "@/lib/authz";
import { getStoreSettingsForApi } from "@/lib/store-settings";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } }
    });

    if (!order) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
    if (order.userId && !isStaffRole(session?.user?.role) && session?.user?.id !== order.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getStoreSettingsForApi();
    const total = Number(order.total);

    // Calculate per-item GST (use item's gstRate if available, else global rate)
    const items = order.items.map((item) => {
      const amount = Number(item.price) * item.quantity;
      const itemGstRate = item.gstRate !== null && item.gstRate !== undefined
        ? Number(item.gstRate)
        : settings.gstRatePercent;
      const itemGst = calculateInclusiveGst(amount, itemGstRate);
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        amount,
        gstRate: itemGstRate,
        taxableValue: itemGst.taxableValue,
        gstAmount: itemGst.gstAmount
      };
    });

    // Aggregate GST totals
    const totalTaxableValue = items.reduce((sum, i) => sum + i.taxableValue, 0);
    const totalGstAmount = items.reduce((sum, i) => sum + i.gstAmount, 0);
    const totalCgst = totalGstAmount / 2;
    const totalSgst = totalGstAmount / 2;

    // Determine display rate (uniform if all items same rate)
    const uniqueRates = [...new Set(items.map((i) => i.gstRate))];
    const displayRate = uniqueRates.length === 1 ? uniqueRates[0] : settings.gstRatePercent;

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        paymentMethod: order.paymentMethod,
        status: order.status,
        subtotal: Number(order.subtotal),
        total,
        distanceKm: Number(order.distanceKm),
        createdAt: order.createdAt.toISOString(),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          amount: item.amount,
          gstRate: item.gstRate,
          taxableValue: item.taxableValue,
          gstAmount: item.gstAmount
        }))
      },
      store: {
        name: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        gstin: settings.gstin,
        gstBusinessName: gstBusinessName(settings),
        gstRatePercent: settings.gstRatePercent
      },
      gst: {
        rate: displayRate,
        taxableValue: totalTaxableValue,
        gstAmount: totalGstAmount,
        cgst: totalCgst,
        sgst: totalSgst
      }
    });
  } catch (error) {
    console.error("Bill load failed", error);
    return NextResponse.json({ error: "Bill could not be loaded." }, { status: 500 });
  }
}
