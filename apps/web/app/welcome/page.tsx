import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SITE } from "@/lib/constants";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getPublicShellSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Welcome",
  description: `Set up your ${SITE.name} grocery delivery account.`
};

export default async function WelcomePage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const safeCallback = safeCallbackUrl(callbackUrl, "/", ["/", "/products", "/cart", "/checkout", "/dashboard", "/account", "/support"]);

  if (session?.user?.id) {
    redirect(safeCallback);
  }

  const { logoUrl } = await getPublicShellSettings();

  return <OnboardingFlow callbackUrl={safeCallback} logoUrl={logoUrl} />;
}
