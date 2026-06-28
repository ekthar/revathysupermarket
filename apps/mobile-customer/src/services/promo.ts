import { api } from "./api";

export interface PromoValidationResult {
  valid: boolean;
  discount: number;
  description: string;
  error?: string;
}

/**
 * Validate a promo/coupon code
 */
export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<PromoValidationResult> {
  try {
    const { data } = await api.post("/promo-codes/validate", { code, subtotal });
    return {
      valid: data.valid ?? false,
      discount: data.discount ?? 0,
      description: data.description ?? "",
    };
  } catch (e: any) {
    return {
      valid: false,
      discount: 0,
      description: "",
      error: e.response?.data?.error || "Could not validate code",
    };
  }
}

/**
 * Fetch available promo codes for display
 */
export async function getAvailablePromos(): Promise<
  Array<{ code: string; description: string; minAmount: number }>
> {
  try {
    const { data } = await api.get("/promo-codes");
    return data.items || [];
  } catch {
    return [];
  }
}
