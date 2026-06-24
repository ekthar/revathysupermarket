import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { checkoutSchema } from "@/lib/validations";
import { calculateDistanceKm } from "@/lib/distance";
import { getStoreSettingsForApi, isStoreCurrentlyOpen } from "@/lib/store-settings";
import { checkoutErrorResponse, createAuthoritativeOrder } from "@/lib/order-checkout";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

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

export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: auth.userId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          subtotal: true,
          discount: true,
          deliveryFee: true,
          total: true,
          deliveryMode: true,
          estimatedDeliveryAt: true,
          createdAt: true,
          items: {
            select: { name: true, quantity: true, price: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: auth.userId } }),
    ]);

    const items = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      deliveryFee: Number(o.deliveryFee),
      total: Number(o.total),
      deliveryMode: o.deliveryMode,
      estimatedDeliveryAt: o.estimatedDeliveryAt,
      createdAt: o.createdAt,
      itemCount: o.items.length,
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    }));

    return NextResponse.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit(`mobile-order:${auth.userId}`, 5, 600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  try {
    const settings = await getStoreSettingsForApi();
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your checkout details." }, { status: 400 });
    }

    const data = parsed.data;

    // Check store hours
    const storeStatus = isStoreCurrentlyOpen(settings);
    if (!storeStatus.open) {
      return NextResponse.json({ error: storeStatus.message }, { status: 400 });
    }

    const distanceKm = calculateDistanceKm(
      { lat: data.latitude, lng: data.longitude },
      { lat: settings.storeLatitude, lng: settings.storeLongitude }
    );

    const order = await createAuthoritativeOrder({
      data,
      userId: auth.userId,
      orderNumber: await createOrderNumber(),
      distanceKm,
      settings,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: "ORDER_RECEIVED",
    });
  } catch (error) {
    const mapped = checkoutErrorResponse(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status });
    }
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
