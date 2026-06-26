import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/lib/loyalty-config";

export async function awardDeliveredOrderBenefits(orderId: string) {
  const config = await getLoyaltyConfig();
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, orderNumber: true, total: true, loyaltyPointsEarned: true } });
    if (!order?.userId || order.loyaltyPointsEarned > 0) return;
    const points = Math.max(1, Math.floor(Number(order.total) / config.earnRupeesPerPoint));
    const claimed = await tx.order.updateMany({ where: { id: order.id, loyaltyPointsEarned: 0 }, data: { loyaltyPointsEarned: points } });
    if (claimed.count !== 1) return;
    await tx.loyaltyAccount.upsert({ where: { userId: order.userId }, update: { balance: { increment: points }, lifetimeEarned: { increment: points } }, create: { userId: order.userId, balance: points, lifetimeEarned: points } });
    await tx.loyaltyTransaction.create({ data: { userId: order.userId, orderId: order.id, type: "EARN", points, reason: `Earned on order #${order.orderNumber}` } });

    const referral = await tx.referral.findUnique({ where: { referredUserId: order.userId } });
    if (referral?.status === "PENDING") {
      await Promise.all([
        tx.loyaltyAccount.upsert({ where: { userId: referral.referrerId }, update: { balance: { increment: config.referralRewardPoints }, lifetimeEarned: { increment: config.referralRewardPoints } }, create: { userId: referral.referrerId, balance: config.referralRewardPoints, lifetimeEarned: config.referralRewardPoints } }),
        tx.loyaltyAccount.upsert({ where: { userId: order.userId }, update: { balance: { increment: config.referralRewardPoints }, lifetimeEarned: { increment: config.referralRewardPoints } }, create: { userId: order.userId, balance: config.referralRewardPoints, lifetimeEarned: config.referralRewardPoints } }),
        tx.loyaltyTransaction.create({ data: { userId: referral.referrerId, orderId: order.id, type: "REFERRAL", points: config.referralRewardPoints, reason: "Referral reward" } }),
        tx.loyaltyTransaction.create({ data: { userId: order.userId, orderId: order.id, type: "REFERRAL", points: config.referralRewardPoints, reason: "Welcome referral reward" } }),
        tx.referral.update({ where: { id: referral.id }, data: { status: "REWARDED", rewardedAt: new Date() } })
      ]);
    }
  });
}

export async function releaseCancelledOrderReservations(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { deliverySlotId: true, loyaltyPointsRedeemed: true, userId: true, orderNumber: true, items: { select: { productId: true, quantity: true } } } });
    if (!order) return;
    for (const item of order.items) if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    if (order.deliverySlotId) await tx.deliverySlot.updateMany({ where: { id: order.deliverySlotId, bookedCount: { gt: 0 } }, data: { bookedCount: { decrement: 1 } } });
    if (order.userId && order.loyaltyPointsRedeemed > 0) {
      await tx.loyaltyAccount.upsert({ where: { userId: order.userId }, update: { balance: { increment: order.loyaltyPointsRedeemed } }, create: { userId: order.userId, balance: order.loyaltyPointsRedeemed } });
      await tx.loyaltyTransaction.create({ data: { userId: order.userId, orderId, type: "REVERSE", points: order.loyaltyPointsRedeemed, reason: `Returned from cancelled order #${order.orderNumber}` } });
    }
  });
}
