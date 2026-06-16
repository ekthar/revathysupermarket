import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateInclusiveGst, gstBusinessName } from "@/lib/billing";
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
    if (order.userId && session?.user?.role !== "ADMIN" && session?.user?.id !== order.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getStoreSettingsForApi();
    const total = Number(order.total);
    const gst = calculateInclusiveGst(total, settings.gstRatePercent);

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        whatsapp: order.whatsapp,
        address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        paymentMethod: order.paymentMethod,
        status: order.status,
        subtotal: Number(order.subtotal),
        total,
        distanceKm: Number(order.distanceKm),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          amount: Number(item.price) * item.quantity
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
      gst
    });
  } catch (error) {
    console.error("Bill load failed", error);
    return NextResponse.json({ error: "Bill could not be loaded." }, { status: 500 });
  }
}
