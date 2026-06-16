import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Secure staff login for Revathy Supermarket."
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_left,rgba(167,209,41,0.22),transparent_32%),linear-gradient(135deg,rgba(15,138,95,0.12),rgba(255,255,255,0))] px-4 py-8 sm:px-6">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="rounded-[2rem] bg-primary p-6 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.9)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-wide text-lime-fresh">Revathy staff</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Admin control room</h1>
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
