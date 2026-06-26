import type { Metadata } from "next";
import { ForgotPasswordClient } from "@/components/auth/forgot-password-client";

export const metadata: Metadata = { title: "Forgot Password" };

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordClient token={params.token ?? ""} />;
}
