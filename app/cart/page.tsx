import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your Revathy Supermarket grocery cart before checkout."
};

export default function CartPage() {
  return <CartPageClient />;
}
