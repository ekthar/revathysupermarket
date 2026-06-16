"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setMessage("Invalid email or password.");
      return;
    }
    router.push(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft">
      <label>
        <span className="text-sm font-bold">Email</span>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2" />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-bold">Password</span>
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-2" />
      </label>
      {message && <p className="mt-4 rounded-xl bg-muted p-3 text-sm font-medium">{message}</p>}
      <Button className="mt-5 w-full" size="lg" disabled={loading}>
        {loading ? "Signing in" : "Login"}
      </Button>
      <div className="mt-4 flex justify-between text-sm font-semibold">
        <Link href="/register" className="text-primary">Create account</Link>
        <Link href="/forgot-password" className="text-primary">Forgot password</Link>
      </div>
    </form>
  );
}
