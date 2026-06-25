import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StaffLoginClient } from "@/components/auth/staff-login-client";
import { getPublicShellSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Login to your staff account"
};

export default async function StaffLoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    const role = session.user.role;
    if (role === "DELIVERY_PARTNER") redirect("/delivery");
    if (role === "CUSTOMER") redirect("/dashboard");
    if (role && role !== "INVALID") redirect("/admin");
  }

  const { logoUrl } = await getPublicShellSettings();

  return <StaffLoginClient logoUrl={logoUrl} />;
}
