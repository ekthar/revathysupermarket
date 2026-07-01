import { prisma } from "@/lib/prisma";

export const LIVE_ORDER_STATUSES = [
  "ORDER_RECEIVED",
  "AWAITING_CUSTOMER_APPROVAL",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "ARRIVING"
] as const;

export type ActiveOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  eta: number;
};

export type EtaDisplayMode = "always" | "after_assignment";

export type EtaOptions = {
  distanceKm?: number;
  avgPackingMinutes?: number;
  avgDeliverySpeed?: number;
  rushHourMultiplier?: number;
};

/**
 * Distance-aware ETA estimation.
 * Calculates delivery time based on the distance from store to customer (or rider to customer),
 * average packing time, delivery speed, and an optional rush-hour multiplier.
 *
 * Defaults: distanceKm=3, avgPackingMinutes=8, avgDeliverySpeed=18 km/h, rushHourMultiplier=1.0
 */
export function estimateOrderEta(status: string, options?: EtaOptions): number {
  const distanceKm = options?.distanceKm ?? 3;
  const avgPackingMinutes = options?.avgPackingMinutes ?? 8;
  const avgDeliverySpeed = options?.avgDeliverySpeed ?? 18;
  const rushHourMultiplier = options?.rushHourMultiplier ?? 1.0;

  const deliveryMinutes = Math.ceil((distanceKm / avgDeliverySpeed) * 60 * rushHourMultiplier);

  const minutes: Record<string, number> = {
    ORDER_RECEIVED: avgPackingMinutes + deliveryMinutes + 5,
    AWAITING_CUSTOMER_APPROVAL: avgPackingMinutes + deliveryMinutes + 3,
    ACCEPTED: avgPackingMinutes + deliveryMinutes,
    PACKING: Math.ceil(avgPackingMinutes * 0.7) + deliveryMinutes,
    READY_FOR_DELIVERY: deliveryMinutes + 2,
    OUT_FOR_DELIVERY: deliveryMinutes,
    ARRIVING: Math.min(3, deliveryMinutes),
  };

  return minutes[status] ?? 15;
}

export async function getActiveOrderSummary(userId?: string | null): Promise<ActiveOrderSummary | null> {
  if (!userId) return null;
  const order = await prisma.order.findFirst({
    where: { userId, status: { in: [...LIVE_ORDER_STATUSES] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, status: true }
  }).catch(() => null);
  return order ? { ...order, eta: estimateOrderEta(order.status) } : null;
}
