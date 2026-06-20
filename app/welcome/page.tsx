import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SITE } from "@/lib/constants";

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

  return <OnboardingFlow callbackUrl={callbackUrl ?? "/"} />;
}
