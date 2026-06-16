import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-black">Login</h1>
      <p className="mt-3 text-muted-foreground">Access your orders, saved addresses, and profile.</p>
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
