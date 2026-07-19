/**
 * Telegram Order Notifications
 * ════════════════════════════
 *
 * Sends order lifecycle updates via Telegram.
 * Only sends if telegram_enabled feature flag is ON
 * and the customer has a verified TelegramLink.
 *
 * Never throws — all errors are caught internally.
 */

import { isFeatureEnabled } from "@/lib/feature-flags";
import { sendTelegramNotification } from "@/lib/telegram";

const ORDER_MESSAGES: Record<string, { title: string; body: (orderNumber: string, extra?: string) => string }> = {
  ORDER_RECEIVED: {
    title: "🛒 Order Placed",
    body: (num) => `Your order #${num} has been received. We're on it!`,
  },
  ACCEPTED: {
    title: "✅ Order Accepted",
    body: (num) => `Order #${num} accepted! We're preparing your items.`,
  },
  PACKING: {
    title: "📦 Packing Your Order",
    body: (num) => `Order #${num} is being packed now.`,
  },
  READY_FOR_DELIVERY: {
    title: "🎒 Ready for Delivery",
    body: (num) => `Order #${num} is packed and waiting for a delivery partner.`,
  },
  OUT_FOR_DELIVERY: {
    title: "🛵 Out for Delivery",
    body: (num, otp) => `Order #${num} is on the way!${otp ? `\n\nDelivery OTP: <code>${otp}</code>` : ""}`,
  },
  ARRIVING: {
    title: "📍 Almost There",
    body: (num) => `Your rider is arriving with order #${num}. Please be ready!`,
  },
  DELIVERED: {
    title: "🎉 Delivered!",
    body: (num) => `Order #${num} has been delivered. Enjoy your groceries!`,
  },
  CANCELLED: {
    title: "❌ Order Cancelled",
    body: (num) => `Order #${num} has been cancelled. Any payment will be refunded.`,
  },
};

/**
 * Send an order status update via Telegram.
 * Fire-and-forget — never throws.
 *
 * @param phone - Customer phone (normalized with country code)
 * @param orderNumber - Display order number
 * @param status - OrderStatus enum value
 * @param extra - Optional extra info (e.g. delivery OTP)
 */
export async function notifyOrderViaTelegram(
  phone: string,
  orderNumber: string,
  status: string,
  extra?: string
): Promise<void> {
  try {
    const enabled = await isFeatureEnabled("telegram_enabled");
    if (!enabled) return;

    const msg = ORDER_MESSAGES[status];
    if (!msg) return; // Unknown status, skip

    await sendTelegramNotification(phone, msg.title, msg.body(orderNumber, extra));
  } catch (error) {
    console.error("[Telegram] Order notification failed:", error);
  }
}
