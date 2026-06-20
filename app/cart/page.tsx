import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cart",
  description: `Review your ${SITE.name} grocery cart before checkout.`
};

export default function CartPage() {
  return <CartPageClient />;
}
