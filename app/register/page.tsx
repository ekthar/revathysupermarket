import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-black">Create account</h1>
      <p className="mt-3 text-muted-foreground">Register to track orders and save addresses.</p>
      <RegisterForm />
    </main>
  );
}
