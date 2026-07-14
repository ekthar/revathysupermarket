/**
 * Type-safe analytics event definitions.
 *
 * Each event has a name constant and typed payload. All analytics calls
 * use these types to ensure consistent event naming and property shapes.
 */

// --- Event name constants ---

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  PRODUCT_VIEWED: "product_viewed",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  CHECKOUT_STARTED: "checkout_started",
  ORDER_PLACED: "order_placed",
  SEARCH_PERFORMED: "search_performed",
  OFFER_VIEWED: "offer_viewed",
  PROMO_CODE_APPLIED: "promo_code_applied",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// --- Event payload types ---

export interface PageViewPayload {
  url: string;
  referrer?: string;
  title?: string;
}

export interface ProductViewedPayload {
  productId: string;
  productName: string;
  category?: string;
  price?: number;
  slug?: string;
}

export interface AddToCartPayload {
  productId: string;
  productName: string;
  quantity: number;
  price?: number;
}

export interface RemoveFromCartPayload {
  productId: string;
  productName: string;
  quantity?: number;
}

export interface CheckoutStartedPayload {
  cartTotal: number;
  itemCount: number;
  paymentMethod?: string;
}

export interface OrderPlacedPayload {
  orderId: string;
  total: number;
  itemCount: number;
  paymentMethod?: string;
}

export interface SearchPerformedPayload {
  query: string;
  resultCount?: number;
}

export interface OfferViewedPayload {
  offerId?: string;
  offerTitle?: string;
}

export interface PromoCodeAppliedPayload {
  code: string;
  discount?: number;
  success: boolean;
}

// --- Event payload map ---

export interface AnalyticsEventMap {
  [ANALYTICS_EVENTS.PAGE_VIEW]: PageViewPayload;
  [ANALYTICS_EVENTS.PRODUCT_VIEWED]: ProductViewedPayload;
  [ANALYTICS_EVENTS.ADD_TO_CART]: AddToCartPayload;
  [ANALYTICS_EVENTS.REMOVE_FROM_CART]: RemoveFromCartPayload;
  [ANALYTICS_EVENTS.CHECKOUT_STARTED]: CheckoutStartedPayload;
  [ANALYTICS_EVENTS.ORDER_PLACED]: OrderPlacedPayload;
  [ANALYTICS_EVENTS.SEARCH_PERFORMED]: SearchPerformedPayload;
  [ANALYTICS_EVENTS.OFFER_VIEWED]: OfferViewedPayload;
  [ANALYTICS_EVENTS.PROMO_CODE_APPLIED]: PromoCodeAppliedPayload;
}
