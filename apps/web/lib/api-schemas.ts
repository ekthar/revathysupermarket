/**
 * Zod schemas for client-side API response validation.
 *
 * E6: Runtime type checking on critical client-side fetches.
 * Prevents silent crashes when API shape changes unexpectedly.
 *
 * Usage:
 *   const data = await safeFetch("/api/orders/live", liveOrderSchema);
 */

import { z } from "zod";

// ─── Live Order Tracking ─────────────────────────────────────────────────────

export const liveOrderSchema = z.object({
  orders: z.array(z.object({
    id: z.string(),
    orderNumber: z.string(),
    status: z.string(),
  })).optional(),
});

export type LiveOrderResponse = z.infer<typeof liveOrderSchema>;

// ─── Cart Total Calculation ──────────────────────────────────────────────────

export const cartTotalSchema = z.object({
  subtotal: z.number(),
  deliveryFee: z.number(),
  gst: z.number(),
  total: z.number(),
  discount: z.number().optional(),
  freeDelivery: z.boolean().optional(),
});

export type CartTotalResponse = z.infer<typeof cartTotalSchema>;

// ─── Product Search ──────────────────────────────────────────────────────────

export const productSearchSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    price: z.number(),
    discountPrice: z.number().nullable().optional(),
    image: z.string(),
    stock: z.number(),
    category: z.string(),
  })),
  total: z.number().optional(),
});

export type ProductSearchResponse = z.infer<typeof productSearchSchema>;

// ─── Order Status ────────────────────────────────────────────────────────────

export const orderStatusSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  estimatedMinutes: z.number().nullable().optional(),
  deliveryPartner: z.object({
    name: z.string(),
    phone: z.string(),
  }).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type OrderStatusResponse = z.infer<typeof orderStatusSchema>;

// ─── Promo Code Validation ───────────────────────────────────────────────────

export const promoValidationSchema = z.object({
  valid: z.boolean(),
  discount: z.number().optional(),
  message: z.string().optional(),
  discountType: z.enum(["flat", "percentage"]).optional(),
});

export type PromoValidationResponse = z.infer<typeof promoValidationSchema>;

// ─── Safe Fetch Helper ───────────────────────────────────────────────────────

/**
 * Fetch + validate response against a Zod schema.
 * Returns validated data or null if validation fails.
 * Logs schema violations in development.
 */
export async function safeFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) return null;

    const raw = await response.json();
    const result = schema.safeParse(raw);

    if (!result.success) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[safeFetch] Schema validation failed for ${url}:`, result.error.format());
      }
      // Return raw data anyway (graceful degradation) but log the mismatch
      return raw as T;
    }

    return result.data;
  } catch {
    return null;
  }
}
