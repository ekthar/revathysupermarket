"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";

export function AdminLoginForm({ callbackUrl }: { callbackUrl?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("staff-credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials or account locked.");
      return;
    }
    router.push(callbackUrl || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 h-11 rounded-lg" placeholder="staff@revathy.in" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Password</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 h-11 rounded-lg" placeholder="••••••••" />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading || !email || !password}
        className="mt-4 h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
