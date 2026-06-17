import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { StaffSessionSwitch } from "@/components/auth/staff-session-switch";
import { SessionIdentityCard } from "@/components/session-identity-card";
import { isCustomerRole, isDeliveryPartnerRole, isStaffLoginRole, roleLabel } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Secure staff login for Revathy Supermarket."
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; reason?: string }>;
}) {
  const { callbackUrl, reason } = await searchParams;
  const session = await auth();
  const user = session?.user?.id ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  } : null;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_left,rgba(167,209,41,0.22),transparent_32%),linear-gradient(135deg,rgba(15,138,95,0.12),rgba(255,255,255,0))] px-4 py-8 sm:px-6">
      {reason === "staff_required" ? (
        <div className="mx-auto mb-5 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Staff Panel access requires an owner, manager, packing staff, or staff account. Logout first if you are using a customer account.
        </div>
      ) : null}
      {user ? (
        <section className="mx-auto mb-6 max-w-5xl rounded-[1.5rem] border border-border bg-card/95 p-4 shadow-soft">
          <p className="text-xs font-black uppercase text-primary">Current session</p>
          <h2 className="mt-1 font-display text-2xl font-black">Signed in as {roleLabel(user.role)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">One browser can use one active account at a time.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <SessionIdentityCard user={user} />
            <div className="grid gap-2">
              {isStaffLoginRole(user.role) ? <Link href="/admin" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-white">Open Staff Panel</Link> : null}
              {isCustomerRole(user.role) ? <Link href="/dashboard" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-white">Open My Orders</Link> : null}
              {isDeliveryPartnerRole(user.role) ? <Link href="/delivery" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-white">Open Assigned Orders</Link> : null}
              {isCustomerRole(user.role) ? <StaffSessionSwitch /> : null}
            </div>
          </div>
        </section>
      ) : null}
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="rounded-[2rem] bg-primary p-6 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.9)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-wide text-lime-fresh">Revathy staff</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Staff Panel</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">
            Sign in to manage orders, stock, delivery status, customers, and offers for the Neyyattinkara store.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {["Orders", "Stock", "Delivery"].map((item) => (
              <div key={item} className="rounded-2xl bg-white/12 p-3 text-sm font-black backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
        <AdminLoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
