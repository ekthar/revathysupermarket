import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Welcome",
  description: `Welcome to ${SITE.name}. Start shopping fresh groceries.`
};

/**
 * Welcome page now redirects to products (no forced login gate).
 * The new onboarding experience is shown as a non-blocking overlay
 * on the main page via WelcomeOnboarding component in layout.tsx.
 */
export default async function WelcomePage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  // If authenticated, go to callback or home
  if (session?.user?.id) {
    redirect(callbackUrl || "/");
  }

  // Not authenticated — redirect to products (browse-first experience)
  redirect("/products");
}
