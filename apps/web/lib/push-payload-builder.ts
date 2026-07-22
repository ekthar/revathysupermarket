/**
 * Push Notification Payload Builder — generates rich notification payloads.
 *
 * Used by backend API routes (order confirmation, delivery updates, promos)
 * to construct properly formatted push payloads with:
 * - Product/order images
 * - Context-appropriate action buttons
 * - Tag-based grouping (collapses related notifications)
 * - Platform-specific vibration patterns
 * - Deep link URLs for notification tap
 *
 * The service worker (sw.js) receives these payloads and renders them
 * as rich system notifications with all the configured features.
 */

export type NotificationType =
  | "order_confirmed"
  | "order_ready"
  | "order_delivered"
  | "order_cancelled"
  | "delivery_assignment"
  | "new_order_alert"
  | "price_drop"
  | "back_in_stock"
  | "promo"
  | "referral_reward"
  | "loyalty_milestone";

export interface PushPayload {
  title: string;
  body: string;
  type: NotificationType;
  /** Deep link URL to open on tap */
  url: string;
  /** Image URL for rich notification (product/order photo) */
  image?: string;
  /** Badge icon URL (small monochrome) */
  badge?: string;
  /** Notification tag for grouping (same tag = replace, not stack) */
  tag?: string;
  /** Order ID for order-related notifications */
  orderId?: string;
  /** Product ID for product-related notifications */
  productId?: string;
  /** Whether notification persists until dismissed */
  requireInteraction?: boolean;
  /** Action buttons shown on the notification */
  actions?: Array<{ action: string; title: string; icon?: string }>;
  /** Vibration pattern in ms [vibrate, pause, vibrate, ...] */
  vibrate?: number[];
  /** Notification channel ID (Android) */
  channelId?: string;
  /** Data payload (passed to SW for routing) */
  data?: Record<string, string>;
}

// ─── Notification Builders ────────────────────────────────────────────────────

/**
 * Build a push payload for order status updates.
 */
export function buildOrderNotification(opts: {
  type: "order_confirmed" | "order_ready" | "order_delivered" | "order_cancelled";
  orderId: string;
  orderNumber: string;
  estimatedTime?: string;
}): PushPayload {
  const { type, orderId, orderNumber, estimatedTime } = opts;

  const configs: Record<string, { title: string; body: string; actions: PushPayload["actions"] }> = {
    order_confirmed: {
      title: "Order Confirmed! 🎉",
      body: `Order ${orderNumber} is confirmed. ${estimatedTime ? `Estimated delivery: ${estimatedTime}` : "We're preparing your items."}`,
      actions: [
        { action: "track", title: "Track Order" },
        { action: "view", title: "View Details" },
      ],
    },
    order_ready: {
      title: "Order Ready for Delivery 🚴",
      body: `Order ${orderNumber} is out for delivery. Your rider is on the way!`,
      actions: [
        { action: "track", title: "Track Live" },
        { action: "call", title: "Call Rider" },
      ],
    },
    order_delivered: {
      title: "Order Delivered! ✅",
      body: `Order ${orderNumber} has been delivered. Enjoy your groceries!`,
      actions: [
        { action: "rate", title: "Rate Order" },
        { action: "reorder", title: "Reorder" },
      ],
    },
    order_cancelled: {
      title: "Order Cancelled",
      body: `Order ${orderNumber} has been cancelled. Any payment will be refunded.`,
      actions: [
        { action: "view", title: "View Details" },
        { action: "support", title: "Contact Support" },
      ],
    },
  };

  const config = configs[type];

  return {
    title: config.title,
    body: config.body,
    type,
    url: `/track/${orderId}`,
    tag: `order-${orderId}`, // Same order = replace previous notification
    orderId,
    requireInteraction: type === "order_ready",
    actions: config.actions,
    vibrate: type === "order_ready" ? [200, 100, 200, 100, 400] : [200, 100, 200],
    channelId: type === "order_ready" ? "delivery_alerts" : "order_updates",
    data: { type, orderId, orderNumber },
  };
}

/**
 * Build a push payload for product alerts (price drop, back in stock).
 */
export function buildProductAlertNotification(opts: {
  type: "price_drop" | "back_in_stock";
  productName: string;
  productId: string;
  productSlug: string;
  productImage?: string;
  oldPrice?: number;
  newPrice?: number;
}): PushPayload {
  const { type, productName, productId, productSlug, productImage, oldPrice, newPrice } = opts;

  if (type === "price_drop") {
    return {
      title: "Price Drop! 💰",
      body: `${productName} is now ₹${newPrice} (was ₹${oldPrice}). Grab it before it's gone!`,
      type,
      url: `/products/${productSlug}`,
      image: productImage,
      tag: `product-${productId}`,
      productId,
      actions: [
        { action: "add-cart", title: "Add to Cart" },
        { action: "view", title: "View" },
      ],
      vibrate: [100, 50, 100],
      channelId: "deals",
      data: { type, productId, productSlug },
    };
  }

  return {
    title: "Back in Stock! 🎉",
    body: `${productName} is available again. Order now before it sells out!`,
    type,
    url: `/products/${productSlug}`,
    image: productImage,
    tag: `product-${productId}`,
    productId,
    actions: [
      { action: "add-cart", title: "Add to Cart" },
      { action: "view", title: "View" },
    ],
    vibrate: [100, 50, 100],
    channelId: "stock_alerts",
    data: { type, productId, productSlug },
  };
}

/**
 * Build a push payload for promotional notifications.
 */
export function buildPromoNotification(opts: {
  title: string;
  body: string;
  image?: string;
  promoCode?: string;
  url?: string;
}): PushPayload {
  return {
    title: opts.title,
    body: opts.body,
    type: "promo",
    url: opts.url || "/offers",
    image: opts.image,
    tag: "promo-latest", // Only keep latest promo (collapses older ones)
    actions: [
      { action: "shop", title: "Shop Now" },
      ...(opts.promoCode ? [{ action: "copy-code", title: `Use ${opts.promoCode}` }] : []),
    ],
    vibrate: [100],
    channelId: "promotions",
    data: { type: "promo", promoCode: opts.promoCode || "" },
  };
}

/**
 * Build a push payload for loyalty/referral rewards.
 */
export function buildRewardNotification(opts: {
  type: "referral_reward" | "loyalty_milestone";
  title: string;
  body: string;
  points?: number;
}): PushPayload {
  return {
    title: opts.title,
    body: opts.body,
    type: opts.type,
    url: "/account/loyalty",
    tag: `reward-${opts.type}`,
    actions: [
      { action: "view", title: "View Rewards" },
      { action: "shop", title: "Use Points" },
    ],
    vibrate: [100, 50, 100, 50, 200],
    channelId: "rewards",
    data: { type: opts.type, points: String(opts.points || 0) },
  };
}
