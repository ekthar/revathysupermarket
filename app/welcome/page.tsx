import type { Metadata } from "next";
import { auth } from "@/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Welcome to Revathy",
  description: "Set up your Revathy Supermarket grocery delivery account."
};

export default async function WelcomePage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user?.id) return <OnboardingFlow callbackUrl={callbackUrl ?? "/dashboard"} />;
  return <OnboardingFlow callbackUrl={callbackUrl ?? "/dashboard"} />;
}
