import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout-form";
import { getStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place your Revathy Supermarket order with COD or UPI on delivery."
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-black">Create an account to order</h1>
        <p className="mt-3 text-muted-foreground">Revathy orders now require an account so tracking, returns, OTP delivery, and saved addresses work reliably.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/register?callbackUrl=/checkout" className="rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white">Create account</Link>
          <Link href="/login?callbackUrl=/checkout" className="rounded-2xl border border-border px-5 py-3 text-sm font-black">Log in</Link>
        </div>
      </main>
    );
  }
  const settings = await getStoreSettings();
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
  }).catch(() => []);
  return (
    <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Secure local order</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Checkout</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Add your address, serviceable pincode, and GPS location. Orders submit only when you are within the {settings.deliveryRadiusKm} KM delivery radius.
        </p>
      </section>
      <CheckoutForm
        deliveryRadiusKm={settings.deliveryRadiusKm}
        allowedPincodes={settings.serviceablePincodes}
        savedAddresses={addresses.map((address) => ({
          id: address.id,
          label: address.label,
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
