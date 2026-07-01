"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ShoppingBasket, UserCog, Wrench } from "lucide-react";
import { AnimatedGoogleIcon, GoogleIcon } from "@/components/onboarding/google-icon";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { safeCallbackUrl } from "@/lib/safe-redirect";

type Step = "splash" | "signin" | "done";
const STEPS: Step[] = ["splash", "signin", "done"];

const PHONE_COMING_SOON_MESSAGES = [
  "Phone login is getting a makeover",
  "OTP is out getting coffee",
  "SMS is on vacation, Google's covering",
  "Phone login will return... fancier",
];

export function OnboardingFlow({ callbackUrl = "/", logoUrl = null }: { callbackUrl?: string; logoUrl?: string | null }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("splash");
  const [message, setMessage] = useState("");
  const [phoneMessageIdx, setPhoneMessageIdx] = useState(0);

  const safeCallback = safeCallbackUrl(callbackUrl, "/", ["/", "/products", "/cart", "/checkout", "/dashboard", "/account", "/support"]);

  // Auto-advance splash → signin
  useEffect(() => {
    if (step !== "splash") return;
    const timeout = setTimeout(() => setStep("signin"), 1800);
    return () => clearTimeout(timeout);
  }, [step]);

  // Auto-redirect: trigger Google sign-in after splash (optional — uncomment to auto-redirect)
  // useEffect(() => {
  //   if (step !== "signin") return;
  //   const timeout = setTimeout(() => signIn("google", { callbackUrl: safeCallback }), 3000);
  //   return () => clearTimeout(timeout);
  // }, [step, safeCallback]);

  // Rotate phone coming soon messages
  useEffect(() => {
    const interval = setInterval(() => {
      setPhoneMessageIdx((prev) => (prev + 1) % PHONE_COMING_SOON_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const variants = useMemo<Variants>(() => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -60 }
  }), [reduceMotion]);

  return (
    <main className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-neutral-950">
      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
        <AnimatePresence mode="wait">
          {/* ─── SPLASH ─── */}
          {step === "splash" && (
            <motion.div
              key="splash"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary text-white shadow-lg overflow-hidden"
              >
                {logoUrl ? (
                  <Image src={logoUrl} alt="Store logo" width={80} height={80} className="h-full w-full object-contain p-2" unoptimized />
                ) : (
                  <ShoppingBasket className="h-10 w-10" />
                )}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 font-display text-3xl font-black text-neutral-900 dark:text-white"
              >
                {SITE.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-sm font-medium text-neutral-500"
              >
                Fresh groceries, delivered fast
              </motion.p>
            </motion.div>
          )}

          {/* ─── SIGN-IN (Google only) ─── */}
          {step === "signin" && (
            <motion.div
              key="signin"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
            >
              {/* Animated Google Icon - Hero */}
              <div className="flex flex-col items-center text-center">
                <AnimatedGoogleIcon size={64} className="mb-6" />

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-2xl font-black text-neutral-900 dark:text-white sm:text-3xl"
                >
                  Sign in to {SITE.name}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-2 text-sm text-neutral-500"
                >
                  One tap to get your groceries delivered
                </motion.p>
              </div>

              {/* Error message */}
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400"
                >
                  {message}
                </motion.p>
              )}

              {/* Google Sign-In - Primary CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
                className="mt-8"
              >
                <motion.button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: safeCallback })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-base font-semibold text-neutral-800 shadow-lg shadow-neutral-200/60 ring-1 ring-neutral-200 transition-shadow hover:shadow-xl dark:bg-white/5 dark:text-white dark:ring-white/10 dark:shadow-none dark:hover:bg-white/10"
                >
                  <GoogleIcon size={22} />
                  Continue with Google
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-3 text-center text-xs text-neutral-400"
                >
                  Secure sign-in powered by Google
                </motion.p>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="my-7 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                <span className="text-xs font-medium text-neutral-400">phone login</span>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
              </motion.div>

              {/* Phone OTP - Coming Soon animated CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="relative overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-5 py-4 dark:border-amber-500/30 dark:bg-amber-500/5"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                  >
                    <Wrench className="h-5 w-5 text-amber-500" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Coming Soon
                    </p>
                    <motion.p
                      key={phoneMessageIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-xs text-amber-600/70 dark:text-amber-400/60"
                    >
                      {PHONE_COMING_SOON_MESSAGES[phoneMessageIdx]}
                    </motion.p>
                  </div>
                  <span className="text-lg">📱</span>
                </div>
              </motion.div>

              {/* Skip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-5"
              >
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("onboarding-complete", "skipped");
                    router.push("/products");
                  }}
                  className="w-full py-2 text-center text-sm font-medium text-neutral-400 transition hover:text-neutral-600"
                >
                  Skip for now
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Staff login link */}
      {step !== "done" && (
        <div className="pb-6 text-center">
          <a
            href="/staff-login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <UserCog className="h-3.5 w-3.5" />
            Staff? Login here
          </a>
        </div>
      )}
    </main>
  );
}
