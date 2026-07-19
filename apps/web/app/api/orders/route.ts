import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceKm } from "@/lib/distance";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";
import { isStaffRole } from "@/lib/authz";
import { checkoutSchema } from "@/lib/validations";
import { getStoreSettingsForApi, isStoreCurrentlyOpen } from "@/lib/store-settings";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";
import { notifyOrderStatus } from "@/lib/notifications";
import { checkoutErrorResponse, createAuthoritativeOrder } from "@/lib/order-checkout";
import { broadcastToAllDeliveryPartners } from "@/lib/delivery-alerts";
import { publishNewOrder, publishOrderStatusChanged } from "@/lib/realtime/event-publisher";
import { sendPushToUser } from "@/lib/push";
import { sendFcmToAdmins } from "@/lib/fcm-admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { notifyOrderSms } from "@/lib/sms/notify-order";
import { notifyOrderViaTelegram } from "@/lib/telegram-notifications";
import { getActiveDeliveryOtp } from "@/lib/delivery";

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
    const limit = await enforceRateLimit(`order:${clientIp(request)}`, 10, 600);
    if (limit.limited) return rateLimitResponse(limit.reset);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please create an account or log in before placing an order." }, { status: 401 });
    }
    const settings = await getStoreSettingsForApi();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Please check your checkout details." }, { status: 400 });

    const data = parsed.data;

    // Check store hours
    const storeStatus = isStoreCurrentlyOpen(settings);
    if (!storeStatus.open) {
      return NextResponse.json({ error: storeStatus.message }, { status: 400 });
    }

    // GPS distance is the only delivery eligibility check.
    // Pincode validation removed — address auto-filled from reverse geocoding.
    const distanceKm = calculateDistanceKm(
      { lat: data.latitude, lng: data.longitude },
      { lat: settings.storeLatitude, lng: settings.storeLongitude }
    );
    if (distanceKm > settings.deliveryRadiusKm) {
      return NextResponse.json(
        { error: `Sorry, delivery is available only within ${settings.deliveryRadiusKm} KM of our store. You are ${distanceKm.toFixed(1)} KM away.` },
        { status: 400 }
      );
    }

    // Retry order creation on unique constraint violation (P2002) for orderNumber
    let order: Awaited<ReturnType<typeof createAuthoritativeOrder>>;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        order = await createAuthoritativeOrder({
          data,
          userId: session.user.id,
          orderNumber: await createOrderNumber(),
          distanceKm,
          settings
        });
        break;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("orderNumber") &&
          attempt < MAX_RETRIES - 1
        ) {
          continue;
        }
        throw err;
      }
    }

    // Address upsert — user-facing concern, keep before parallel block
    const existingAddress = await prisma.address.findFirst({
      where: { userId: session.user.id, houseName: data.houseName, pincode: data.pincode, street: data.street }
    }).catch((e) => { console.error("Address find failed:", e); return null; });
    if (!existingAddress) {
      await prisma.address.create({ data: { userId: session.user.id, label: "Home", customerName: data.customerName, phone: data.phone, houseName: data.houseName, street: data.street, landmark: data.landmark, pincode: data.pincode, latitude: data.latitude, longitude: data.longitude } }).catch((e) => { console.error("Address create failed:", e); return null; });
    } else {
      await prisma.address.update({ where: { id: existingAddress.id }, data: { customerName: data.customerName, phone: data.phone, landmark: data.landmark, latitude: data.latitude, longitude: data.longitude } }).catch((e) => { console.error("Address update failed:", e); return null; });
    }

    // Fire-and-forget side effects — run all in parallel
    const orderAddress = `${data.houseName}, ${data.street}, ${data.landmark}, ${data.pincode}`;
    await Promise.allSettled([
      sendWhatsAppTemplate({ to: order!.phone, template: "order_confirmed", params: [order!.orderNumber, String(order!.items.length), Number(order!.total).toFixed(2), order!.paymentMethod], orderId: order!.id }).catch((e) => { console.error("WhatsApp order confirmation failed:", e); return null; }),
      notifyOrderStatus(session.user.id, order!.orderNumber, "ORDER_RECEIVED", order!.id).catch((e) => { console.error("Order status notification failed:", e); return null; }),
      broadcastToAllDeliveryPartners({
        type: "new_order",
        order: {
          id: order!.id,
          orderNumber: order!.orderNumber,
          customerName: data.customerName,
          address: orderAddress,
          total: Number(order!.total)
        }
      }),
      sendFcmToAdmins({
        type: "new_order_alert",
        eventId: `new-order-${order!.id}-${Date.now()}`,
        orderId: order!.id,
        orderNumber: order!.orderNumber,
        deepLink: `msmsupermarket://admin/orders/${order!.id}`,
      }).catch((e) => { console.error("FCM admin notification failed:", e); return null; }),
      // Send push to all delivery partners in parallel (fix N+1)
      prisma.user.findMany({
        where: { role: "DELIVERY_PARTNER", isActive: true },
        select: { id: true }
      }).catch((e) => { console.error("Delivery partner fetch failed:", e); return [] as { id: string }[]; }).then((partners) =>
        Promise.all(partners.map((partner) =>
          sendPushToUser(partner.id, {
            title: "🆕 New Order!",
            body: `Order #${order!.orderNumber} from ${data.customerName} - ₹${Number(order!.total).toFixed(0)}`,
            url: "/delivery",
            orderId: order!.id
          }).catch((e) => { console.error("Push to delivery partner failed:", e); return null; })
        ))
      ),
      publishNewOrder({
        orderId: order!.id,
        orderNumber: order!.orderNumber,
        customerName: data.customerName,
        address: orderAddress,
        total: Number(order!.total),
      }).catch((e) => { console.error("New order event publish failed:", e); return null; }),
      publishOrderStatusChanged({
        orderId: order!.id,
        orderNumber: order!.orderNumber,
        status: "ORDER_RECEIVED",
        userId: session.user.id,
      }).catch((e) => { console.error("Order status event publish failed:", e); return null; }),
      // Send order confirmation email (fire-and-forget, checks feature flag internally)
      sendOrderConfirmationEmail({
        to: session.user.email ?? "",
        orderNumber: order!.orderNumber,
        customerName: data.customerName,
        items: order!.items.map((item: { name: string; quantity: number; price: unknown }) => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        total: Number(order!.total),
        deliveryAddress: orderAddress,
      }),
      // Send order confirmation SMS (fire-and-forget, checks feature flag internally)
      notifyOrderSms("confirmed", order!.phone, {
        orderNumber: order!.orderNumber,
        total: Number(order!.total),
      }),
      // Send order confirmation via Telegram (fire-and-forget, checks feature flag internally)
      notifyOrderViaTelegram(order!.phone, order!.orderNumber, "ORDER_RECEIVED"),
    ]);

    return NextResponse.json({ orderId: order!.id, orderNumber: order!.orderNumber, total: Number(order!.total) });
  } catch (error) {
    const checkoutError = checkoutErrorResponse(error);
    if (checkoutError) return NextResponse.json({ error: checkoutError.error, code: checkoutError.code }, { status: checkoutError.status });
    console.error("Order create failed", error);
    return NextResponse.json({ error: "Order could not be placed. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = 50;

    const whereClause = isStaffRole(session.user.role) ? {} : { userId: session.user.id };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
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
          deliveryInstructions: true,
          latitude: true,
          longitude: true,
          distanceKm: true,
          paymentMethod: true,
          paymentStatus: true,
          status: true,
          editApprovalStatus: true,
          deliveryOtp: true,
          deliveryOtpExpiresAt: true,
          acknowledgedAt: true,
          deliveryPartnerId: true,
          subtotal: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  image: true,
                  description: true,
                  stock: true,
                  popularity: true,
                  unit: true,
                  isFeatured: true,
                  createdAt: true,
                  category: { select: { name: true } }
                }
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
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const hasMore = orders.length > limit;
    const sliced = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

    const isStaff = isStaffRole(session.user.role);

    return NextResponse.json({
      orders: sliced.map((order) => ({
        ...order,
        // For staff: hide expired delivery OTP. For customers: show active OTP only.
        deliveryOtp: isStaff
          ? getActiveDeliveryOtp(order.deliveryOtp, order.deliveryOtpExpiresAt)
          : getActiveDeliveryOtp(order.deliveryOtp, order.deliveryOtpExpiresAt),
        deliveryOtpExpiresAt: order.deliveryOtpExpiresAt?.toISOString() ?? null,
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
      })),
      nextCursor,
      totalCount,
    });
  } catch (error) {
    console.error("Order list failed", error);
    return NextResponse.json({ error: "Orders could not be loaded." }, { status: 500 });
  }
}
