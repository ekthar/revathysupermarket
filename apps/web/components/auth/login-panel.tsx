"use client";

/**
 * Login Panel — Beautiful Split-Panel Auth Page
 * ══════════════════════════════════════════════
 *
 * Left panel: Animated product showcase / brand storytelling
 * Right panel: Clean Google sign-in form
 *
 * Features:
 * - Split layout (desktop), stacked (mobile)
 * - Animated floating product cards on left
 * - Spring-animated form entrance
 * - Google sign-in + skip option
 * - Brand color gradient left panel
 * - Responsive & accessible
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Shield,
  ShoppingBasket,
  Star,
  Truck,
  UserCog,
} from "lucide-react";
import { GoogleIcon } from "@/components/onboarding/google-icon";
import { BiometricLoginButton } from "@/components/auth/biometric-login-button";
import { SITE } from "@/lib/constants";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { springs, tapScale } from "@/lib/motion";

// ─── Floating Feature Cards ──────────────────────────────────────────────────

const features = [
  {
    icon: <Truck className="h-5 w-5 text-emerald-500" />,
    title: "~30 min delivery",
    subtitle: "Fresh from store to door",
  },
  {
    icon: <Clock className="h-5 w-5 text-violet-500" />,
    title: "Live tracking",
    subtitle: "Watch your order move",
  },
  {
    icon: <Shield className="h-5 w-5 text-blue-500" />,
    title: "Pay on delivery",
    subtitle: "COD & UPI accepted",
  },
  {
    icon: <Star className="h-5 w-5 text-amber-500" />,
    title: "Earn rewards",
    subtitle: "Points on every order",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPanel({
  callbackUrl = "/",
  logoUrl = null,
}: {
  callbackUrl?: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [message, setMessage] = useState("");

  const safeCallback = safeCallbackUrl(callbackUrl, "/", [
    "/",
    "/products",
    "/cart",
    "/checkout",
    "/dashboard",
    "/account",
    "/support",
  ]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: safeCallback });
  };

  return (
    <main className="fixed inset-0 z-[100] flex bg-white dark:bg-neutral-950">
      {/* Left Panel — Brand showcase (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        {/* Decorative radials */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/15 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...springs.enter }}
            className="flex items-center gap-3 mb-10"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={SITE.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <ShoppingBasket className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="font-display text-xl font-black text-white tracking-tight">
              {SITE.name}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springs.enter }}
            className="font-display text-4xl xl:text-5xl font-black text-white leading-tight"
          >
            Fresh groceries,{"\n"}
            delivered to{"\n"}
            your door.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, ...springs.enter }}
            className="mt-4 text-lg text-white/70 max-w-md leading-relaxed"
          >
            Join thousands of happy customers. Sign in to track orders, earn rewards, and checkout faster.
          </motion.p>

          {/* Feature cards */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...springs.enter }}
            className="mt-10 grid grid-cols-2 gap-3"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={reduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.1, ...springs.enter }}
                className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{feature.title}</p>
                  <p className="text-xs text-white/60">{feature.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Auth form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-12 relative">
        {/* Back button */}
        <div className="absolute top-6 left-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
          </button>
        </div>

        {/* Mobile logo (shown on small screens) */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.enter}
          className="lg:hidden mb-8 flex items-center gap-3"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={SITE.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <ShoppingBasket className="h-5 w-5" />
            </div>
          )}
          <span className="font-display text-lg font-black text-neutral-900 dark:text-white">
            {SITE.name}
          </span>
        </motion.div>

        {/* Form content */}
        <div className="w-full max-w-sm">
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...springs.enter }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white text-center">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 text-center">
              Sign in to access your account, orders, and rewards.
            </p>
          </motion.div>

          {/* Error message */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-600 dark:text-red-400"
            >
              {message}
            </motion.p>
          )}

          {/* Biometric Login (native app only — shown when credentials stored) */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, ...springs.enter }}
            className="mt-8"
          >
            <BiometricLoginButton callbackUrl={safeCallback} />
          </motion.div>

          {/* Google Sign-In */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springs.enter }}
            className="mt-4"
          >
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale.primary}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white dark:bg-neutral-800 text-base font-semibold text-neutral-800 dark:text-white shadow-lg shadow-neutral-200/50 dark:shadow-none ring-1 ring-neutral-200 dark:ring-neutral-700 transition-all hover:shadow-xl hover:ring-neutral-300 dark:hover:ring-neutral-600"
            >
              <GoogleIcon size={22} />
              Continue with Google
            </motion.button>

            <p className="mt-3 text-center text-xs text-neutral-400">
              Secure sign-in powered by Google OAuth
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="my-8 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs font-medium text-neutral-400">or</span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </motion.div>

          {/* Browse without signing in */}
          <motion.div
            initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, ...springs.enter }}
          >
            <Link
              href="/products"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Browse without signing in
            </Link>
          </motion.div>

          {/* Terms */}
          <motion.p
            initial={reduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center text-xs text-neutral-400 leading-relaxed"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </motion.p>
        </div>

        {/* Staff login link */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6"
        >
          <a
            href="/staff-login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <UserCog className="h-3.5 w-3.5" />
            Staff? Login here
          </a>
        </motion.div>
      </div>
    </main>
  );
}
