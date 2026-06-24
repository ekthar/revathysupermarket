import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeliveryLoginClient } from "@/components/delivery/delivery-login-client";
import { getPublicShellSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Delivery Partner Login",
  description: "Login to your delivery partner account"
};

export default async function DeliveryLoginPage() {
  const session = await auth();

  if (session?.user?.id && session.user.role === "DELIVERY_PARTNER") {
    redirect("/delivery");
  }

  if (session?.user?.id && session.user.role !== "DELIVERY_PARTNER") {
    redirect("/");
  }

  const { logoUrl } = await getPublicShellSettings();

  return <DeliveryLoginClient logoUrl={logoUrl} />;
}
