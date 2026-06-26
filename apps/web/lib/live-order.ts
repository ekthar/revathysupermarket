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

export function estimateOrderEta(status: string) {
  const minutes: Record<string, number> = {
    ORDER_RECEIVED: 20,
    AWAITING_CUSTOMER_APPROVAL: 18,
    ACCEPTED: 16,
    PACKING: 14,
    READY_FOR_DELIVERY: 10,
    OUT_FOR_DELIVERY: 8,
    ARRIVING: 3
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
