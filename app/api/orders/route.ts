import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceKm } from "@/lib/distance";
import { rateLimit } from "@/lib/rate-limit";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { isStaffRole } from "@/lib/authz";
import { checkoutSchema } from "@/lib/validations";
import { isServiceablePincode } from "@/lib/delivery";
import { getStoreSettingsForApi } from "@/lib/store-settings";

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please create an account or log in before placing an order." }, { status: 401 });
    }
    const settings = await getStoreSettingsForApi();
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
    const requestedProductIds = data.items.map((item) => item.productId).filter(Boolean);
    const existingProducts = requestedProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: requestedProductIds } },
          select: { id: true }
        })
      : [];
    const existingProductIds = new Set(existingProducts.map((product) => product.id));
    const number = await createOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        userId: session.user.id,
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
        paymentStatus: data.paymentMethod === "ONLINE" ? "PENDING" : "PENDING",
        subtotal,
        total: subtotal,
        items: {
          create: data.items.map((item) => ({
            productId: existingProductIds.has(item.productId) ? item.productId : null,
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

    const whatsappUrl = buildWhatsAppUrl({
      orderNumber: order.orderNumber,
      total: Number(order.total)
    }, settings.whatsapp);

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
      where: isStaffRole(session.user.role) ? {} : { userId: session.user.id },
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
        paymentStatus: true,
        status: true,
        editApprovalStatus: true,
        deliveryOtp: true,
        subtotal: true,
        total: true,
        createdAt: true,
        items: true,
        statusEvents: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        latitude: Number(order.latitude),
        longitude: Number(order.longitude),
        distanceKm: Number(order.distanceKm),
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price)
        })),
        statusEvents: order.statusEvents.map((event) => ({
          ...event,
          createdAt: event.createdAt.toISOString()
        }))
      }))
    });
  } catch (error) {
    console.error("Order list failed", error);
    return NextResponse.json({ error: "Orders could not be loaded." }, { status: 500 });
  }
}
