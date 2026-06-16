import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Login or create your Revathy Supermarket account."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; mode?: string }>;
}) {
  const { callbackUrl, mode } = await searchParams;
  return (
    <main className="min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(167,209,41,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(15,138,95,0.16),transparent_34%)] px-4 py-6 sm:px-6 sm:py-10">
      <LoginForm callbackUrl={callbackUrl} initialMode={mode === "register" ? "register" : "login"} />
    </main>
  );
}
