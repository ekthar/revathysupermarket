import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceKm } from "@/lib/distance";
import { rateLimit } from "@/lib/rate-limit";
import { isStaffRole } from "@/lib/authz";
import { checkoutSchema } from "@/lib/validations";
import { isServiceablePincode } from "@/lib/delivery";
import { getStoreSettingsForApi } from "@/lib/store-settings";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

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
        { error: "Sorry, this pincode is not currently serviceable." },
        { status: 400 }
      );
    }

    const distanceKm = calculateDistanceKm({ lat: data.latitude, lng: data.longitude });
    if (distanceKm > settings.deliveryRadiusKm) {
      return NextResponse.json(
        { error: `Sorry, delivery is currently available only within ${settings.deliveryRadiusKm} KM of our store.` },
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
        houseName: data.houseName,
        street: data.street,
        landmark: data.landmark,
        pincode: data.pincode,
        notes: data.notes,
        latitude: data.latitude,
        longitude: data.longitude,
        distanceKm,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
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

    // Save address only if it doesn't already exist for this user (prevent duplicates)
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id,
        houseName: data.houseName,
        pincode: data.pincode,
        street: data.street
      }
    }).catch(() => null);

    if (!existingAddress) {
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
    } else {
      // Update the existing address with latest coordinates/landmark if changed
      await prisma.address.update({
        where: { id: existingAddress.id },
        data: {
          landmark: data.landmark,
          latitude: data.latitude,
          longitude: data.longitude
        }
      }).catch(() => null);
    }

    await sendWhatsAppTemplate({
      to: order.phone,
      template: "order_confirmed",
      params: [order.orderNumber, String(order.items.length), Number(order.total).toFixed(2), order.paymentMethod],
      orderId: order.id
    });

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber });
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
        acknowledgedAt: true,
        deliveryPartnerId: true,
        subtotal: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        },
        deliveryPartner: {
          select: {
            currentLatitude: true,
            currentLongitude: true,
            locationUpdatedAt: true
          }
        },
        editLogs: {
          where: { requiresCustomerApproval: true, customerDecision: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            action: true,
            originalItem: true,
            newItem: true,
            priceDelta: true,
            reason: true,
            createdAt: true
          }
        },
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
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
          product: item.product ? {
            id: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            category: item.product.category.name,
            price: Number(item.product.price),
            discountPrice: item.product.discountPrice ? Number(item.product.discountPrice) : undefined,
            image: item.product.image,
            description: item.product.description,
            stock: item.product.stock,
            popularity: item.product.popularity,
            unit: item.product.unit,
            isFeatured: item.product.isFeatured,
            createdAt: item.product.createdAt.toISOString()
          } : null
        })),
        deliveryPartnerLocation: order.deliveryPartner?.currentLatitude && order.deliveryPartner.currentLongitude ? {
          latitude: Number(order.deliveryPartner.currentLatitude),
          longitude: Number(order.deliveryPartner.currentLongitude),
          updatedAt: order.deliveryPartner.locationUpdatedAt?.toISOString()
        } : null,
        editLogs: order.editLogs.map((log) => ({
          ...log,
          priceDelta: Number(log.priceDelta),
          createdAt: log.createdAt.toISOString()
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
