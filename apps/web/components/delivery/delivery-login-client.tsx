"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Bike, Phone, Shield, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "phone" | "otp";

export function DeliveryLoginClient({ logoUrl }: { logoUrl?: string | null }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOtp = useCallback(async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, role: "DELIVERY_PARTNER" })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to send OTP. Contact admin.");
        setLoading(false);
        return;
      }

      setStep("otp");
      setCountdown(30);
      setCanResend(false);
      // Vibrate for haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("phone-otp", {
        phone: phone.replace(/\D/g, ""),
        otp,
        name: "",
        redirect: false
      });

      if (result?.error) {
        setError("Invalid OTP. Please try again.");
        setOtp("");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setLoading(false);
        return;
      }

      // Check if user is delivery partner
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role !== "DELIVERY_PARTNER") {
        setError("This login is only for delivery partners. Contact admin if you need access.");
        setLoading(false);
        return;
      }

      if (navigator.vibrate) navigator.vibrate(50);
      window.location.href = "/delivery";
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [phone, otp]);

  const resendOtp = useCallback(async () => {
    if (!canResend) return;
    setOtp("");
    setError("");
    setCanResend(false);
    setCountdown(30);
    await sendOtp();
  }, [canResend, sendOtp]);

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
              <Bike className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">
            Delivery Partner
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Login with your registered phone number
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Phone className="mb-2 inline h-4 w-4" /> Phone number
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    placeholder="9876543210"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-lg font-bold tracking-wide outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-400"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    aria-live="polite"
                    className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  onClick={sendOtp}
                  disabled={loading || phone.length < 10}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send OTP <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Shield className="mb-2 inline h-4 w-4" /> Enter 6-digit OTP
                </label>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Sent to +91 {phone}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(val);
                    setError("");
                    // Auto-submit when 6 digits entered
                    if (val.length === 6) {
                      setTimeout(() => verifyOtp(), 100);
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                  placeholder="● ● ● ● ● ●"
                  className="mt-3 h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl font-black tracking-[0.5em] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  autoFocus
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    aria-live="polite"
                    className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length < 6}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify & Login <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    ← Change number
                  </button>
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">
                      Resend in {countdown}s
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Not a delivery partner?{" "}
          <a href="/login" className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
            Customer login
          </a>
        </p>
      </motion.div>
    </main>
  );
}
