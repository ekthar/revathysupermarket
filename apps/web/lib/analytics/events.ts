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
  CATEGORY_VIEWED: "category_viewed",
  CART_VIEWED: "cart_viewed",
  CHECKOUT_STEP_COMPLETED: "checkout_step_completed",
  SEARCH_ZERO_RESULTS: "search_zero_results",
  PRODUCT_LIST_VIEWED: "product_list_viewed",
  VARIANT_SELECTED: "variant_selected",
  DELIVERY_SLOT_SELECTED: "delivery_slot_selected",
  FUNNEL_DROP_OFF: "funnel_drop_off",
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

export interface CategoryViewedPayload {
  categoryName: string;
  categorySlug: string;
  productCount?: number;
}

export interface CartViewedPayload {
  itemCount: number;
  cartTotal: number;
}

export interface CheckoutStepCompletedPayload {
  step: number;
  stepName: string;
}

export interface SearchZeroResultsPayload {
  query: string;
  category?: string;
}

export interface ProductListViewedPayload {
  source: string;
  count: number;
}

export interface VariantSelectedPayload {
  productId: string;
  variantId: string;
  variantLabel: string;
}

export interface DeliverySlotSelectedPayload {
  slotId: string;
  date?: string;
  timeRange?: string;
}

export interface FunnelDropOffPayload {
  from: string;
  to: string;
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
  [ANALYTICS_EVENTS.CATEGORY_VIEWED]: CategoryViewedPayload;
  [ANALYTICS_EVENTS.CART_VIEWED]: CartViewedPayload;
  [ANALYTICS_EVENTS.CHECKOUT_STEP_COMPLETED]: CheckoutStepCompletedPayload;
  [ANALYTICS_EVENTS.SEARCH_ZERO_RESULTS]: SearchZeroResultsPayload;
  [ANALYTICS_EVENTS.PRODUCT_LIST_VIEWED]: ProductListViewedPayload;
  [ANALYTICS_EVENTS.VARIANT_SELECTED]: VariantSelectedPayload;
  [ANALYTICS_EVENTS.DELIVERY_SLOT_SELECTED]: DeliverySlotSelectedPayload;
  [ANALYTICS_EVENTS.FUNNEL_DROP_OFF]: FunnelDropOffPayload;
}
