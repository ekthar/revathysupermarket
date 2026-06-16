import { z } from "zod";
import { orderStatuses } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8)
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  whatsapp: z.string().min(8),
  houseName: z.string().min(2),
  street: z.string().min(2),
  landmark: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "UPI_ON_DELIVERY"]),
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
  stock: z.coerce.number().int().min(0),
  description: z.string().min(10),
  image: z.string().url()
});

export const orderStatusSchema = z.object({
  status: z.enum(orderStatuses)
});
