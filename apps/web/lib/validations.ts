import { z } from "zod";
import { orderStatuses } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8).optional().or(z.literal("")),
  phone: z.string().min(8).optional().or(z.literal(""))
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  houseName: z.string().min(2),
  street: z.string().min(2),
  landmark: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "UPI_ON_DELIVERY", "WALLET", "CARD"]),
  deliveryMode: z.enum(["ASAP", "SCHEDULED"]).default("ASAP"),
  deliverySlotId: z.string().optional(),
  promoCode: z.string().trim().max(40).optional(),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        price: z.coerce.number().positive(),
        quantity: z.coerce.number().int().positive()
      })
    )
    .min(1)
});

export const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  gstRate: z.coerce.number().min(0).max(28).optional(),
  stock: z.coerce.number().int().min(0),
  description: z.string().min(10),
  image: z.string().trim().optional(),
  unit: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  costPrice: z.coerce.number().positive().optional(),
  brand: z.string().trim().max(100).optional()
});

export const orderStatusSchema = z.object({
  status: z.enum(orderStatuses),
  staffNote: z.string().max(500).optional()
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

export const orderEditSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("remove"),
    itemId: z.string(),
    reason: z.string().max(300).optional()
  }),
  z.object({
    action: z.literal("quantity-change"),
    itemId: z.string(),
    quantity: z.coerce.number().int().min(1),
    reason: z.string().max(300).optional()
  }),
  z.object({
    action: z.literal("substitute"),
    itemId: z.string(),
    productId: z.string(),
    quantity: z.coerce.number().int().min(1).optional(),
    reason: z.string().max(300).optional()
  })
]);

export const customerApprovalSchema = z.object({
  decision: z.enum(["approved", "rejected"])
});

export const returnRequestSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.coerce.number().int().min(1)
  })).min(1),
  reason: z.enum(["wrong_item", "damaged", "quality_issue", "changed_mind", "other"]),
  billNumber: z.string().min(1, "Bill number is required"),
  photoUrl: z.string().url().optional().or(z.literal("")),
  note: z.string().max(500).optional()
});

export const returnResolutionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "REFUNDED"]),
  refundMethod: z.enum(["CASH", "UPI", "GATEWAY", "WALLET"]).optional(),
  refundAmount: z.coerce.number().min(0).optional(),
  refundReference: z.string().max(120).optional(),
  resolutionNote: z.string().min(2).max(500)
});

export const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  role: z.enum(["OWNER", "MANAGER", "PACKING_STAFF", "DELIVERY_PARTNER", "STAFF"]),
  password: z.string().min(8),
  vehicleInfo: z.string().max(120).optional()
});

export const staffUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Za-z]/).regex(/\d/)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/\d/)
});

export const deliveryAssignmentSchema = z.object({
  deliveryPartnerId: z.string().nullable()
});

export const deliveryLocationSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  heading: z.coerce.number().optional()
});

export const deliveryActionSchema = z.object({
  action: z.enum(["picked_up", "delivered", "request_cancel"]),
  otp: z.string().optional(),
  reason: z.string().optional()
});
