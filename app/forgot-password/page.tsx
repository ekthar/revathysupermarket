import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-black">Forgot password</h1>
      <p className="mt-3 text-muted-foreground">
        Enter your email and store staff can help reset your account access.
      </p>
      <form className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <Input type="email" placeholder="Email address" required />
        <Button className="mt-4 w-full">Request reset</Button>
      </form>
    </main>
  );
}
