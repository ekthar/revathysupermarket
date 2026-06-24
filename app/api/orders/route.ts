import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrBearer } from "@/lib/flutter-auth-session";
import { calculateDistanceKm } from "@/lib/distance";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";
import { isStaffRole } from "@/lib/authz";
import { checkoutSchema } from "@/lib/validations";
import { isServiceablePincode } from "@/lib/delivery";
import { getStoreSettingsForApi, isStoreCurrentlyOpen } from "@/lib/store-settings";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";
import { notifyOrderStatus } from "@/lib/notifications";
import { checkoutErrorResponse, createAuthoritativeOrder } from "@/lib/order-checkout";

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

    const session = await getSessionOrBearer(request);
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

    /* Client totals are display-only; minimum value is checked from database prices below.
    // Check minimum order value
    const orderSubtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (orderSubtotal < settings.minimumOrderValue) {
      return NextResponse.json(
        { error: `Minimum order value is ₹${settings.minimumOrderValue}. Please add more items.` },
        { status: 400 }
      );
    }

    */
    if (!isServiceablePincode(data.pincode, settings.serviceablePincodes)) {
      return NextResponse.json(
        { error: "Sorry, this pincode is not currently serviceable." },
        { status: 400 }
      );
    }

    const distanceKm = calculateDistanceKm(
      { lat: data.latitude, lng: data.longitude },
      { lat: settings.storeLatitude, lng: settings.storeLongitude }
    );
    if (distanceKm > settings.deliveryRadiusKm) {
      return NextResponse.json(
        { error: `Sorry, delivery is currently available only within ${settings.deliveryRadiusKm} KM of our store.` },
        { status: 400 }
      );
    }

    {
      const order = await createAuthoritativeOrder({
        data,
        userId: session.user.id,
        orderNumber: await createOrderNumber(),
        distanceKm,
        settings
      });

      const existingAddress = await prisma.address.findFirst({
        where: { userId: session.user.id, houseName: data.houseName, pincode: data.pincode, street: data.street }
      }).catch(() => null);
      if (!existingAddress) {
        await prisma.address.create({ data: { userId: session.user.id, label: "Home", houseName: data.houseName, street: data.street, landmark: data.landmark, pincode: data.pincode, latitude: data.latitude, longitude: data.longitude } }).catch(() => null);
      } else {
        await prisma.address.update({ where: { id: existingAddress.id }, data: { landmark: data.landmark, latitude: data.latitude, longitude: data.longitude } }).catch(() => null);
      }
      await sendWhatsAppTemplate({ to: order.phone, template: "order_confirmed", params: [order.orderNumber, String(order.items.length), Number(order.total).toFixed(2), order.paymentMethod], orderId: order.id }).catch(() => null);
      await notifyOrderStatus(session.user.id, order.orderNumber, "ORDER_RECEIVED", order.id).catch(() => null);
      return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, total: Number(order.total) });
    }

    /* Replaced by createAuthoritativeOrder above.
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const requestedProductIds = data.items.map((item) => item.productId).filter(Boolean);
    const existingProducts = requestedProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: requestedProductIds } },
          select: { id: true }
        })
      : [];
    const existingProductIds = new Set(existingProducts.map((product) => product.id));

    // Fetch per-product GST rates
    const productGstRates = requestedProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: requestedProductIds } },
          select: { id: true, gstRate: true }
        })
      : [];
    const gstRateByProductId = new Map(productGstRates.map((p) => [p.id, p.gstRate ? Number(p.gstRate) : null]));

    const number = await createOrderNumber();

    // Calculate wallet deduction if paying with wallet
    let walletDeduction = 0;
    let effectivePaymentMethod = data.paymentMethod;
    let effectivePaymentStatus: "PENDING" | "PAID" = "PENDING";

    if (data.paymentMethod === "WALLET") {
      const [creditAgg, debitAgg] = await Promise.all([
        prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { userId: session.user.id, type: "credit" } }),
        prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { userId: session.user.id, type: "debit" } })
      ]);
      const walletBalance = Number(creditAgg._sum.amount ?? 0) - Number(debitAgg._sum.amount ?? 0);

      if (walletBalance <= 0) {
        return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
      }

      walletDeduction = Math.min(walletBalance, subtotal);
      // If wallet covers the full amount, mark as PAID
      if (walletDeduction >= subtotal) {
        effectivePaymentStatus = "PAID";
      }
    }

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
        paymentMethod: data.paymentMethod === "WALLET" ? "WALLET" : data.paymentMethod,
        paymentStatus: effectivePaymentStatus,
        subtotal,
        total: subtotal,
        items: {
          create: data.items.map((item) => ({
            productId: existingProductIds.has(item.productId) ? item.productId : null,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            gstRate: gstRateByProductId.get(item.productId) ?? settings.gstRatePercent ?? null
          }))
        },
        statusEvents: {
          create: { status: "ORDER_RECEIVED", note: "Order submitted online." }
        }
      },
      include: { items: true }
    });

    // Deduct wallet balance if applicable
    if (walletDeduction > 0) {
      await prisma.walletTransaction.create({
        data: {
          userId: session.user.id,
          orderId: order.id,
          amount: walletDeduction,
          type: "debit",
          reason: `Payment for order #${order.orderNumber}`
        }
      });
    }

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

    // Deduct inventory for each ordered product
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        }).catch(() => null);
      }
    }

    // Send in-app notification
    await notifyOrderStatus(session.user.id, order.orderNumber, "ORDER_RECEIVED", order.id).catch(() => null);

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber });
    */
  } catch (error) {
    const checkoutError = checkoutErrorResponse(error);
    if (checkoutError) return NextResponse.json({ error: checkoutError.error, code: checkoutError.code }, { status: checkoutError.status });
    console.error("Order create failed", error);
    return NextResponse.json({ error: "Order could not be placed. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionOrBearer(request);
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
