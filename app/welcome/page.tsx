import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

  if (session?.user?.id) {
    redirect(callbackUrl || "/");
  }

  const logoSetting = await prisma.setting.findUnique({ where: { key: "logoUrl" } }).catch(() => null);

  return <OnboardingFlow callbackUrl={callbackUrl ?? "/"} logoUrl={logoSetting?.value || null} />;
}
