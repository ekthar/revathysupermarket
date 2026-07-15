import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { SITE } from "@/lib/constants";
import { getPublicStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Cart",
  description: `Review your ${SITE.name} grocery cart before checkout.`
};

export default async function CartPage() {
  const settings = await getPublicStoreSettings();
  const initialConfig = {
    gstRatePercent: settings.gstRatePercent,
    deliveryFee: settings.deliveryFee,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    minimumOrderValue: settings.minimumOrderValue,
    storeName: settings.storeName,
    gstin: settings.gstin
  };

  return <CartPageClient initialConfig={initialConfig} />;
}
