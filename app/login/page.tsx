import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Login",
  description: `Login or create your ${SITE.name} account.`
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user?.id) {
    const role = session.user.role;
    if (role === "DELIVERY_PARTNER") redirect("/delivery");
    if (role && role !== "CUSTOMER" && role !== "INVALID") redirect("/admin");
    redirect(callbackUrl || "/dashboard");
  }

  const logoSetting = await prisma.setting.findUnique({ where: { key: "logoUrl" } }).catch(() => null);

  return <OnboardingFlow callbackUrl={callbackUrl ?? "/"} logoUrl={logoSetting?.value || null} />;
}
