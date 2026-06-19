import { prisma } from "@/lib/prisma";

/**
 * Create an in-app notification for a user.
 * Call this whenever an order status changes, refund is issued, etc.
 */
export async function createNotification({
  userId,
  title,
  body,
  type = "order",
  orderId
}: {
  userId: string;
  title: string;
  body: string;
  type?: "order" | "refund" | "promo" | "system";
  orderId?: string;
}) {
  try {
    await prisma.notification.create({
      data: { userId, title, body, type, orderId }
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Helper to send order status notifications
 */
export async function notifyOrderStatus(userId: string, orderNumber: string, status: string, orderId: string) {
  const messages: Record<string, { title: string; body: string }> = {
    ACCEPTED: { title: "Order Accepted", body: `Your order #${orderNumber} has been accepted and is being prepared.` },
    PACKING: { title: "Packing Your Order", body: `Your order #${orderNumber} is being packed now.` },
    READY_FOR_DELIVERY: { title: "Ready for Delivery", body: `Your order #${orderNumber} is packed and ready for pickup by delivery partner.` },
    OUT_FOR_DELIVERY: { title: "Out for Delivery!", body: `Your order #${orderNumber} is on the way. Get ready!` },
    DELIVERED: { title: "Order Delivered", body: `Your order #${orderNumber} has been delivered. Thank you!` },
    CANCELLED: { title: "Order Cancelled", body: `Your order #${orderNumber} has been cancelled.` }
  };

  const msg = messages[status];
  if (msg) {
    await createNotification({ userId, title: msg.title, body: msg.body, type: "order", orderId });
  }
}
