import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Login",
  description: "Login or create your MSM Supermarket account."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  // Already logged in → redirect to appropriate page
  if (session?.user?.id) {
    const role = session.user.role;
    if (role === "DELIVERY_PARTNER") redirect("/delivery");
    if (role && role !== "CUSTOMER" && role !== "INVALID") redirect("/admin");
    redirect(callbackUrl || "/dashboard");
  }

  return <OnboardingFlow callbackUrl={callbackUrl ?? "/"} />;
}
