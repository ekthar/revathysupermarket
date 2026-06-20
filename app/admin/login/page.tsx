import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Staff and admin login."
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; reason?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, reason } = await searchParams;

  // If already authenticated as staff, redirect to admin
  const staffRoles = ["ADMIN", "OWNER", "MANAGER", "PACKING_STAFF", "STAFF"];
  if (session?.user?.id && staffRoles.includes(session.user.role ?? "")) {
    redirect(callbackUrl || "/admin");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-2xl font-black text-slate-900 dark:text-white">Staff Login</h1>
          <p className="mt-1 text-sm text-slate-500">For admin, managers, and staff only</p>
          {reason === "staff_required" && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              This area requires staff access.
            </p>
          )}
        </div>
        <AdminLoginForm callbackUrl={callbackUrl} />
        <p className="mt-6 text-center text-xs text-slate-400">
          Customer? <a href="/login" className="font-semibold text-primary hover:underline">Use customer login</a>
        </p>
      </div>
    </main>
  );
}
