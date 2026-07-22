import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout-form";
import { getStoreSettings } from "@/lib/store-settings";
import { getFeatureFlag, isFeatureEnabled } from "@/lib/feature-flags";

import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Place your ${SITE.name} order with COD or UPI on delivery.`
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="mx-auto max-w-sm px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-black text-neutral-900 dark:text-white">Sign in to checkout</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Create an account for order tracking, saved addresses, and delivery updates.</p>
        <div className="mt-6 grid gap-3">
          <Link href="/register?callbackUrl=/checkout" className="flex h-12 items-center justify-center rounded-2xl bg-neutral-900 dark:bg-white text-sm font-bold text-white dark:text-neutral-900 transition-transform press">Create account</Link>
          <Link href="/login?callbackUrl=/checkout" className="flex h-12 items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 transition-transform press">Log in</Link>
        </div>
      </main>
    );
  }
  const settings = await getStoreSettings();
  const [addresses, deliveryModeFlag, instantDeliveryEnabled, slotOnlyMode, tipEnabled, codEnabled, upiOnDeliveryEnabled, razorpayEnabled] = await Promise.all([
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    }).catch(() => []),
    getFeatureFlag<{ mode?: "both" | "instant" | "scheduled" }>("delivery_mode"),
    isFeatureEnabled("instant_delivery_enabled"),
    isFeatureEnabled("slot_only_mode"),
    isFeatureEnabled("tip_enabled"),
    isFeatureEnabled("cod_enabled"),
    isFeatureEnabled("upi_on_delivery_enabled"),
    isFeatureEnabled("razorpay_enabled"),
  ]);
  const deliveryMode = deliveryModeFlag.enabled ? deliveryModeFlag.config?.mode ?? "both" : "instant";
  const allowScheduledDelivery = deliveryMode === "both" || deliveryMode === "scheduled" || slotOnlyMode;
  const allowInstantDelivery = !slotOnlyMode && instantDeliveryEnabled && (deliveryMode === "both" || deliveryMode === "instant");
  return (
    <main className="mx-auto max-w-3xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Clean, focused checkout header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-neutral-900 dark:text-white">Checkout</h1>
        <p className="mt-1 text-caption text-neutral-500 dark:text-neutral-400">
          Delivery within {settings.deliveryRadiusKm} km · ~{settings.deliveryEstimateMin}-{settings.deliveryEstimateMax} min
        </p>
      </div>
      <CheckoutForm
        deliveryRadiusKm={settings.deliveryRadiusKm}
        deliveryEstimateMin={settings.deliveryEstimateMin}
        deliveryEstimateMax={settings.deliveryEstimateMax}
        minimumOrderValue={settings.minimumOrderValue}
        storeLatitude={settings.storeLatitude}
        storeLongitude={settings.storeLongitude}
        deliveryFee={settings.deliveryFee}
        freeDeliveryThreshold={settings.freeDeliveryThreshold}
        gstRatePercent={settings.gstRatePercent}
        gstin={settings.gstin}
        allowScheduledDelivery={allowScheduledDelivery}
        allowInstantDelivery={allowInstantDelivery}
        tipEnabled={tipEnabled}
        codEnabled={codEnabled}
        upiOnDeliveryEnabled={upiOnDeliveryEnabled}
        razorpayEnabled={razorpayEnabled}
        savedAddresses={addresses.map((address) => ({
          id: address.id,
          label: address.label,
          customerName: address.customerName ?? "",
          phone: address.phone ?? "",
          houseName: address.houseName,
          street: address.street,
          landmark: address.landmark,
          pincode: address.pincode,
          latitude: Number(address.latitude),
          longitude: Number(address.longitude),
          isDefault: address.isDefault
        }))}
      />
    </main>
  );
}
