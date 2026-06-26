import { z } from "zod";

// ============================================
// Auth Schemas
// ============================================

export const loginWithPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long")
    .regex(/^[+]?[\d\s-]+$/, "Invalid phone number format"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export const loginWithEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ============================================
// Cart Schemas
// ============================================

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(50),
});

// ============================================
// Checkout Schemas
// ============================================

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["COD", "UPI_ON_DELIVERY", "WALLET", "CARD"]),
  deliveryMode: z.enum(["ASAP", "SCHEDULED"]),
  addressId: z.string().min(1, "Address is required"),
  scheduledSlot: z.string().optional(),
  promoCode: z.string().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================
// Address Schemas
// ============================================

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  houseName: z.string().min(1, "House name is required"),
  street: z.string().min(1, "Street is required"),
  landmark: z.string().optional().default(""),
  pincode: z
    .string()
    .length(6, "Pincode must be 6 digits")
    .regex(/^\d{6}$/, "Pincode must be numeric"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ============================================
// Delivery Schemas
// ============================================

export const acknowledgeAssignmentSchema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const collectionSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["COD", "UPI_ON_DELIVERY", "CARD"]),
  notes: z.string().max(500).optional(),
});

export const damageReportSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      name: z.string(),
      quantity: z.number().int().min(1),
      reason: z.string().min(1),
    })
  ),
});

// ============================================
// Support Schemas
// ============================================

export const createTicketSchema = z.object({
  subject: z.string().min(5, "Subject too short").max(200),
  message: z.string().min(10, "Message too short").max(2000),
  orderId: z.string().optional(),
});

// ============================================
// Settings Schemas
// ============================================

export const updateSettingsSchema = z.object({
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  themeMode: z.enum(["system", "light", "dark"]).optional(),
});

// ============================================
// Promo Code Schema
// ============================================

export const applyPromoSchema = z.object({
  code: z.string().min(1, "Promo code is required").max(20),
});

// Export inferred types
export type LoginWithPhoneInput = z.infer<typeof loginWithPhoneSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type AcknowledgeAssignmentInput = z.infer<typeof acknowledgeAssignmentSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type DamageReportInput = z.infer<typeof damageReportSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;
