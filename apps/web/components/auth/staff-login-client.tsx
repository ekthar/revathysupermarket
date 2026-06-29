"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { UserCog, Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export function StaffLoginClient({ logoUrl }: { logoUrl?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("staff-credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      setError("Invalid email or password. Contact your admin if locked out.");
      setLoading(false);
      return;
    }

    // Fetch session to determine redirect based on role
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    if (role === "DELIVERY_PARTNER") {
      window.location.href = "/delivery";
    } else {
      window.location.href = "/admin";
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          {logoUrl ? (
            <Image src={logoUrl} alt="Store logo" width={56} height={56} className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50">
              <UserCog className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">
            Staff Login
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in with your staff credentials
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              <Mail className="mb-2 inline h-4 w-4" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="staff@msmsupermarket.in"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-400"
              autoFocus
            />

            <label className="mt-4 block text-sm font-bold text-slate-700 dark:text-slate-300">
              <Lock className="mb-2 inline h-4 w-4" /> Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                required
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-semibold outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-400"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Not a staff member?{" "}
          <a href="/login" className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
            Customer login
          </a>
        </p>
      </motion.div>
    </main>
  );
}
