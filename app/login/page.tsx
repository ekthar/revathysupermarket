import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { SessionIdentityCard } from "@/components/session-identity-card";
import { isCustomerRole, isDeliveryPartnerRole, isStaffLoginRole, roleLabel } from "@/lib/roles";

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
  const session = await auth();
  const user = session?.user?.id ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  } : null;

  return (
    <main className="min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(167,209,41,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(15,138,95,0.16),transparent_34%)] px-4 py-6 sm:px-6 sm:py-10">
      {user ? (
        <section className="mx-auto mb-6 max-w-3xl rounded-[1.5rem] border border-border bg-card/95 p-4 shadow-soft">
          <p className="text-xs font-black uppercase text-primary">Current session</p>
          <h2 className="mt-1 font-display text-2xl font-black">Signed in as {roleLabel(user.role)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">One browser can use one active account at a time.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <SessionIdentityCard user={user} />
            <div className="grid gap-2">
              {isCustomerRole(user.role) ? <Link href="/dashboard" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-white">Continue to My Orders</Link> : null}
              {isStaffLoginRole(user.role) ? <Link href="/admin" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-white">Open Staff Panel</Link> : null}
              {isDeliveryPartnerRole(user.role) ? <Link href="/delivery" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-white">Open Assigned Orders</Link> : null}
            </div>
          </div>
        </section>
      ) : null}
      <LoginForm callbackUrl={callbackUrl} initialMode={mode === "register" ? "register" : "login"} />
    </main>
  );
}
