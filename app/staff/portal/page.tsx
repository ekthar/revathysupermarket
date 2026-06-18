import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Staff Portal",
  description: "Internal staff access for Revathy Supermarket."
};

const staffRoles = ["ADMIN", "OWNER", "MANAGER", "PACKING_STAFF", "STAFF"];

export default async function StaffPortalPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user?.id && staffRoles.includes(session.user.role ?? "")) {
    redirect(callbackUrl || "/admin");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Staff Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Internal access only</p>
        </div>
        <AdminLoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
