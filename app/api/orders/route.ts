import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceKm } from "@/lib/distance";
import { rateLimit } from "@/lib/rate-limit";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { checkoutSchema } from "@/lib/validations";
import { SITE } from "@/lib/constants";
import { isServiceablePincode } from "@/lib/delivery";
import { getStoreSettings } from "@/lib/store-settings";

function orderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `RS-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function createOrderNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = orderNumber();
    const existing = await prisma.order.findUnique({ where: { orderNumber: number }, select: { id: true } });
    if (!existing) return number;
  }
  return `RS-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    const limit = rateLimit(`order:${ip}`, 10);
    if (limit.limited) return NextResponse.json({ error: "Too many order attempts. Please try again shortly." }, { status: 429 });

    const session = await auth();
    const settings = await getStoreSettings();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Please check your checkout details." }, { status: 400 });

    const data = parsed.data;
    if (!isServiceablePincode(data.pincode, settings.serviceablePincodes)) {
      return NextResponse.json(
        { error: "Sorry, this pincode is not currently serviceable by Revathy Supermarket." },
        { status: 400 }
      );
    }

    const distanceKm = calculateDistanceKm({ lat: data.latitude, lng: data.longitude });
    if (distanceKm > settings.deliveryRadiusKm) {
      return NextResponse.json(
        { error: `Sorry, delivery is currently available only within ${settings.deliveryRadiusKm} KM of Revathy Supermarket.` },
        { status: 400 }
      );
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const number = await createOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        userId: session?.user?.id,
        customerName: data.customerName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        houseName: data.houseName,
        street: data.street,
        landmark: data.landmark,
        pincode: data.pincode,
        notes: data.notes,
        latitude: data.latitude,
        longitude: data.longitude,
        distanceKm,
        paymentMethod: data.paymentMethod,
        subtotal,
        total: subtotal,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        },
        statusEvents: {
          create: { status: "ORDER_RECEIVED", note: "Order submitted online." }
        }
      },
      include: { items: true }
    });

    if (session?.user?.id) {
      await prisma.address.create({
        data: {
          userId: session.user.id,
          label: "Home",
          houseName: data.houseName,
          street: data.street,
          landmark: data.landmark,
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude
        }
      }).catch(() => null);
    }

    const address = `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`;
    const whatsappUrl = buildWhatsAppUrl({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      whatsapp: order.whatsapp,
      address,
      total: Number(order.total),
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    });

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, whatsappUrl });
  } catch (error) {
    console.error("Order create failed", error);
    return NextResponse.json({ error: "Order could not be placed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orders = await prisma.order.findMany({
      where: session.user.role === "ADMIN" ? {} : { userId: session.user.id },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        whatsapp: true,
        houseName: true,
        street: true,
        landmark: true,
        pincode: true,
        notes: true,
        latitude: true,
        longitude: true,
        distanceKm: true,
        paymentMethod: true,
        status: true,
        subtotal: true,
        total: true,
        createdAt: true,
        items: true,
        statusEvents: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Order list failed", error);
    return NextResponse.json({ error: "Orders could not be loaded." }, { status: 500 });
  }
}
