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

    // Calculate per-item GST breakdown
    const items = order.items.map((item) => {
      const amount = Number(item.price) * item.quantity;
      const itemGstRate = item.gstRate !== null ? Number(item.gstRate) : settings.gstRatePercent;
      const itemGst = calculateInclusiveGst(amount, itemGstRate);
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        amount,
        gstRate: itemGstRate,
        taxableValue: itemGst.taxableValue,
        gstAmount: itemGst.gstAmount,
        cgst: itemGst.cgst,
        sgst: itemGst.sgst
      };
    });

    // Aggregate GST totals across all items
    const totalTaxableValue = items.reduce((sum, i) => sum + i.taxableValue, 0);
    const totalGstAmount = items.reduce((sum, i) => sum + i.gstAmount, 0);
    const totalCgst = items.reduce((sum, i) => sum + i.cgst, 0);
    const totalSgst = items.reduce((sum, i) => sum + i.sgst, 0);

    // Check if all items have the same GST rate (for simplified display)
    const uniqueRates = [...new Set(items.map((i) => i.gstRate))];
    const uniformRate = uniqueRates.length === 1 ? uniqueRates[0] : null;

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
        items
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
        rate: uniformRate ?? settings.gstRatePercent,
        taxableValue: totalTaxableValue,
        gstAmount: totalGstAmount,
        cgst: totalCgst,
        sgst: totalSgst,
        perItem: items.map((i) => ({
          name: i.name,
          rate: i.gstRate,
          taxable: i.taxableValue,
          gst: i.gstAmount
        }))
      }
    });
  } catch (error) {
    console.error("Bill load failed", error);
    return NextResponse.json({ error: "Bill could not be loaded." }, { status: 500 });
  }
}
