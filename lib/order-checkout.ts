import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import type { StoreSettings } from "@/lib/store-settings";
import { getLoyaltyConfig } from "@/lib/loyalty-config";

type CheckoutInput = z.infer<typeof checkoutSchema>;

export async function createAuthoritativeOrder({
  data,
  userId,
  orderNumber,
  distanceKm,
  settings
}: {
  data: CheckoutInput;
  userId: string;
  orderNumber: string;
  distanceKm: number;
  settings: StoreSettings;
}) {
  const requestedIds = [...new Set(data.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: requestedIds }, isActive: true },
    select: { id: true, name: true, price: true, discountPrice: true, gstRate: true }
  });
  if (products.length !== requestedIds.length) throw new Error("PRODUCT_UNAVAILABLE");
  const productById = new Map(products.map((product) => [product.id, product]));
  const items = data.items.map((item) => {
    const product = productById.get(item.productId)!;
    return { product, quantity: item.quantity, unitPrice: Number(product.discountPrice ?? product.price) };
  });
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (subtotal < settings.minimumOrderValue) throw new Error("MINIMUM_ORDER");
  const loyaltyConfig = await getLoyaltyConfig();

  return prisma.$transaction(async (tx) => {
    let estimatedDeliveryAt = new Date(Date.now() + settings.deliveryEstimateMax * 60_000);
    if (data.deliveryMode === "SCHEDULED") {
      if (!data.deliverySlotId) throw new Error("DELIVERY_SLOT_REQUIRED");
      const slot = await tx.deliverySlot.findUnique({ where: { id: data.deliverySlotId } });
      if (!slot?.isActive || slot.endsAt <= new Date() || slot.bookedCount >= slot.capacity) throw new Error("DELIVERY_SLOT_FULL");
      const claimed = await tx.deliverySlot.updateMany({
        where: { id: slot.id, bookedCount: slot.bookedCount },
        data: { bookedCount: { increment: 1 } }
      });
      if (claimed.count !== 1) throw new Error("DELIVERY_SLOT_FULL");
      estimatedDeliveryAt = slot.endsAt;
    }

    for (const item of items) {
      const claimed = await tx.product.updateMany({
        where: { id: item.product.id, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } }
      });
      if (claimed.count !== 1) throw new Error(`OUT_OF_STOCK:${item.product.name}`);
    }

    let promoId: string | null = null;
    let promoDiscount = 0;
    if (data.promoCode) {
      const code = data.promoCode.toUpperCase();
      const promo = await tx.promoCode.findUnique({ where: { code } });
      const now = new Date();
      const previousUse = promo ? await tx.promoRedemption.findUnique({ where: { promoCodeId_userId: { promoCodeId: promo.id, userId } } }) : null;
      if (!promo?.isActive || previousUse || (promo.startsAt && promo.startsAt > now) || (promo.expiresAt && promo.expiresAt < now) || subtotal < Number(promo.minimumOrder)) throw new Error("PROMO_INVALID");
      promoDiscount = promo.discountType === "percentage" ? subtotal * Number(promo.discountValue) / 100 : Number(promo.discountValue);
      if (promo.maxDiscount) promoDiscount = Math.min(promoDiscount, Number(promo.maxDiscount));
      promoDiscount = Math.min(subtotal, promoDiscount);
      const claimed = promo.usageLimit
        ? await tx.promoCode.updateMany({ where: { id: promo.id, usedCount: { lt: promo.usageLimit } }, data: { usedCount: { increment: 1 } } })
        : await tx.promoCode.updateMany({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
      if (claimed.count !== 1) throw new Error("PROMO_EXHAUSTED");
      promoId = promo.id;
    }

    let pointsRedeemed = 0;
    if (data.loyaltyPoints > 0) {
      const account = await tx.loyaltyAccount.findUnique({ where: { userId } });
      const maximumPoints = Math.floor((subtotal * (loyaltyConfig.maxRedemptionPercent / 100)) / loyaltyConfig.pointValueRupees);
      pointsRedeemed = Math.min(data.loyaltyPoints, maximumPoints);
      if (!account || pointsRedeemed <= 0 || account.balance < pointsRedeemed) throw new Error("LOYALTY_BALANCE");
      await tx.loyaltyAccount.update({ where: { userId }, data: { balance: { decrement: pointsRedeemed } } });
    }

    const loyaltyDiscount = pointsRedeemed * loyaltyConfig.pointValueRupees;
    const discount = Math.min(subtotal, promoDiscount + loyaltyDiscount);
    const deliveryFee = settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
    const total = Math.max(0, subtotal - discount + deliveryFee);
    let walletDeduction = 0;
    let paymentStatus: "PENDING" | "PAID" = "PENDING";
    if (data.paymentMethod === "WALLET") {
      const [credits, debits] = await Promise.all([
        tx.walletTransaction.aggregate({ _sum: { amount: true }, where: { userId, type: "credit" } }),
        tx.walletTransaction.aggregate({ _sum: { amount: true }, where: { userId, type: "debit" } })
      ]);
      const balance = Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0);
      if (balance <= 0) throw new Error("WALLET_BALANCE");
      walletDeduction = Math.min(balance, total);
      if (walletDeduction >= total) paymentStatus = "PAID";
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
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
        paymentStatus,
        subtotal,
        discount,
        deliveryFee,
        total,
        deliveryMode: data.deliveryMode,
        deliverySlotId: data.deliveryMode === "SCHEDULED" ? data.deliverySlotId : null,
        estimatedDeliveryAt,
        loyaltyPointsRedeemed: pointsRedeemed,
        items: { create: items.map((item) => ({ productId: item.product.id, name: item.product.name, quantity: item.quantity, price: item.unitPrice, gstRate: item.product.gstRate ?? settings.gstRatePercent })) },
        statusEvents: { create: { status: "ORDER_RECEIVED", note: "Order submitted online." } }
      },
      include: { items: true }
    });

    if (walletDeduction > 0) await tx.walletTransaction.create({ data: { userId, orderId: order.id, amount: walletDeduction, type: "debit", reason: `Payment for order #${order.orderNumber}` } });
    if (pointsRedeemed > 0) await tx.loyaltyTransaction.create({ data: { userId, orderId: order.id, type: "REDEEM", points: -pointsRedeemed, reason: `Redeemed on order #${order.orderNumber}` } });
    if (promoId) await tx.promoRedemption.create({ data: { promoCodeId: promoId, userId, orderId: order.id, discount: promoDiscount } });
    return order;
  }, { isolationLevel: "Serializable" });
}

export function checkoutErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "PRODUCT_UNAVAILABLE") return { status: 409, error: "One or more products are no longer available.", code: message };
  if (message === "MINIMUM_ORDER") return { status: 400, error: "Your cart no longer meets the minimum order value.", code: message };
  if (message === "DELIVERY_SLOT_REQUIRED") return { status: 400, error: "Choose a delivery slot.", code: message };
  if (message === "DELIVERY_SLOT_FULL") return { status: 409, error: "That delivery slot just filled up. Choose another slot.", code: message };
  if (message.startsWith("OUT_OF_STOCK:")) return { status: 409, error: `${message.slice(13)} is no longer available in the requested quantity.`, code: "OUT_OF_STOCK" };
  if (message === "PROMO_INVALID" || message === "PROMO_EXHAUSTED") return { status: 409, error: "That promo code is no longer available.", code: message };
  if (message === "LOYALTY_BALANCE") return { status: 409, error: "Your points balance changed. Review and try again.", code: message };
  if (message === "WALLET_BALANCE") return { status: 409, error: "Insufficient wallet balance.", code: message };
  return null;
}
