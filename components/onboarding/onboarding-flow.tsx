"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import { Input } from "@/components/ui/input";

type Step = "splash" | "name" | "auth" | "done";

export function OnboardingFlow({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [name, setName] = useState("");
  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/staff") ? callbackUrl : "/";

  // Splash auto-advance
  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setStep("name"), 1800);
    return () => clearTimeout(t);
  }, [step]);

  // Done auto-redirect
  useEffect(() => {
    if (step !== "done") return;
    localStorage.setItem("onboarding-complete", "true");
    const t = setTimeout(() => { router.push(safeCallback); router.refresh(); }, 2000);
    return () => clearTimeout(t);
  }, [step, router, safeCallback]);

  function handleGoogleLogin() {
    // Save name to localStorage so we can update profile after OAuth callback
    if (name.trim()) localStorage.setItem("pending-name", name.trim());
    signIn("google", { callbackUrl: safeCallback });
  }

  function handleSkip() {
    localStorage.setItem("onboarding-complete", "skipped");
    router.push("/");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <AnimatePresence mode="wait">
        {/* ─── SPLASH ─── */}
        {step === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center px-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-sm">
              <ShoppingBasket className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Revathy</h1>
            <p className="mt-1 text-sm text-slate-500">Fresh groceries, delivered fast</p>
          </motion.div>
        )}

        {/* ─── NAME ─── */}
        {step === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-sm px-6"
          >
            <h1 className="text-2xl font-bold text-slate-900">What's your name?</h1>
            <p className="mt-1 text-sm text-slate-500">So we know who to deliver to</p>

            {name.trim().length >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-base font-medium text-primary"
              >
                Hey, {name.trim()} 👋
              </motion.p>
            )}

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              className="mt-4 h-12 rounded-lg border-slate-200 text-base"
            />

            <button
              type="button"
              onClick={() => setStep("auth")}
              disabled={name.trim().length < 2}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98] transition"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="mt-4 w-full text-center text-sm text-slate-400"
            >
              Skip for now
            </button>
          </motion.div>
        )}

        {/* ─── AUTH (Google default) ─── */}
        {step === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-sm px-6"
          >
            <h1 className="text-2xl font-bold text-slate-900">Almost there!</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to save your orders and addresses</p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm active:scale-[0.98] transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 active:scale-[0.98] transition"
            >
              Browse without account
            </button>

            <button
              type="button"
              onClick={() => setStep("name")}
              className="mt-3 w-full text-center text-xs text-slate-400"
            >
              ← Go back
            </button>
          </motion.div>
        )}

        {/* ─── DONE ─── */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center px-6"
          >
            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">You're all set!</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome, {name || "shopper"}. Let's get your groceries.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
