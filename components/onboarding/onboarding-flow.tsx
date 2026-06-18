"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Chrome, LocateFixed, MapPin, Phone, ShoppingBasket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/onboarding/otp-input";
import { PhoneInput } from "@/components/onboarding/phone-input";
import { ProgressDots } from "@/components/onboarding/progress-dots";
import { readApiResponse } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Step = "splash" | "name" | "phone" | "otp" | "location" | "done";
const STEPS: Step[] = ["splash", "name", "phone", "otp", "location", "done"];

export function OnboardingFlow({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("splash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [locationAddress, setLocationAddress] = useState("");
  const [locating, setLocating] = useState(false);

  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("/admin") ? callbackUrl : "/";
  const currentIndex = STEPS.indexOf(step);

  // Auto-advance splash
  useEffect(() => {
    if (step !== "splash") return;
    const timeout = setTimeout(() => setStep("name"), 1800);
    return () => clearTimeout(timeout);
  }, [step]);

  // OTP timer
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // Done auto-redirect
  useEffect(() => {
    if (step !== "done") return;
    localStorage.setItem("onboarding-complete", "true");
    const timeout = setTimeout(() => {
      router.push(safeCallback);
      router.refresh();
    }, 2500);
    return () => clearTimeout(timeout);
  }, [step, router, safeCallback]);

  const variants = useMemo<Variants>(() => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -60 }
  }), [reduceMotion]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 1) setStep(STEPS[idx - 1]);
  }, [step]);

  async function sendOtp() {
    if (phone.length !== 10) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await readApiResponse<{ error?: string }>(res);
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not send OTP. Try again.");
      return;
    }
    setTimer(30);
    setStep("otp");
  }

  async function verifyOtp() {
    if (otp.length !== 6) return;
    setLoading(true);
    setMessage("");
    const result = await signIn("phone-otp", { phone, otp, name, redirect: false });
    setLoading(false);
    if (result?.error) {
      setMessage("Code is incorrect or expired. Try again.");
      return;
    }
    // Save name
    await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    }).catch(() => null);
    setStep("location");
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setMessage("Location not available on this device.");
      return;
    }
    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          setLocationAddress(data?.display_name ?? `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        } catch {
          setLocationAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setLocating(false);
      },
      () => {
        setMessage("Location access denied. You can add your address later.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <main className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950">
      {/* Top bar */}
      {step !== "splash" && step !== "done" && (
        <div className="flex items-center justify-between px-4 pt-4">
          {currentIndex > 1 ? (
            <button type="button" onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : <span className="w-9" />}
          <ProgressDots current={Math.max(0, currentIndex - 1)} total={4} />
          <span className="w-9" />
        </div>
      )}

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
                className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary text-white shadow-lg"
              >
                <ShoppingBasket className="h-10 w-10" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 font-display text-3xl font-black text-slate-900 dark:text-white"
              >
                Revathy Supermarket
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-sm font-medium text-slate-500"
              >
                Fresh groceries, delivered fast
              </motion.p>
            </motion.div>
          )}

          {/* ─── NAME (Swiggy-style: ask name first) ─── */}
          {step === "name" && (
            <motion.div
              key="name"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                What&apos;s your name?
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                So we know what to call you when your groceries arrive.
              </p>

              {name.trim().length >= 2 && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-2xl bg-primary/5 px-4 py-3 text-center text-lg font-bold text-primary"
                >
                  Hey, {name.trim()}! 👋
                </motion.p>
              )}

              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                className="mt-5 h-14 rounded-2xl border-slate-200 text-lg font-semibold shadow-sm placeholder:text-slate-400 focus-visible:ring-primary dark:border-white/10"
              />

              <Button
                onClick={() => setStep("phone")}
                disabled={name.trim().length < 2}
                size="lg"
                className="mt-5 w-full rounded-2xl"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: safeCallback })}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <Chrome className="h-4 w-4" />
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("onboarding-complete", "skipped");
                    router.push("/products");
                  }}
                  className="w-full py-2 text-center text-sm font-medium text-slate-400 transition hover:text-slate-600"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── PHONE ─── */}
          {step === "phone" && (
            <motion.div
              key="phone"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Enter your number
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                We&apos;ll send a verification code on WhatsApp.
              </p>

              <div className="mt-6">
                <PhoneInput value={phone} onChange={setPhone} />
              </div>

              {message && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {message}
                </p>
              )}

              <Button
                onClick={sendOtp}
                disabled={loading || phone.length !== 10}
                size="lg"
                className="mt-5 w-full rounded-2xl"
              >
                {loading ? "Sending code..." : "Send verification code"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── OTP ─── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Verify your number
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter the 6-digit code sent to <span className="font-semibold text-slate-700 dark:text-white">+91 {phone}</span>
              </p>

              <div className="mt-8">
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              {message && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {message}
                </p>
              )}

              <Button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                size="lg"
                className="mt-6 w-full rounded-2xl"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <button
                type="button"
                onClick={sendOtp}
                disabled={timer > 0 || loading}
                className="mt-4 w-full py-2 text-center text-sm font-medium text-slate-400 disabled:cursor-not-allowed"
              >
                {timer > 0 ? `Resend code in 0:${String(timer).padStart(2, "0")}` : "Resend code"}
              </button>
            </motion.div>
          )}

          {/* ─── LOCATION ─── */}
          {step === "location" && (
            <motion.div
              key="location"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Set delivery location
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Allow location access so we can check if delivery is available in your area.
              </p>

              <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 dark:border-white/10 dark:bg-white/5">
                <LocateFixed className={cn("h-12 w-12 text-primary", locating && "animate-pulse")} />
                {locationAddress ? (
                  <p className="mt-4 text-center text-sm font-medium text-slate-700 dark:text-white">{locationAddress}</p>
                ) : (
                  <p className="mt-4 text-center text-sm text-slate-400">Tap below to detect your location</p>
                )}
              </div>

              {message && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  {message}
                </p>
              )}

              <Button
                onClick={locationAddress ? () => setStep("done") : detectLocation}
                disabled={locating}
                size="lg"
                className="mt-5 w-full rounded-2xl"
              >
                {locating ? "Detecting..." : locationAddress ? "Continue" : "Allow Location"}
                {!locating && <ArrowRight className="h-4 w-4" />}
              </Button>

              <button
                type="button"
                onClick={() => setStep("done")}
                className="mt-3 w-full py-2 text-center text-sm font-medium text-slate-400 transition hover:text-slate-600"
              >
                Skip, I&apos;ll add later
              </button>
            </motion.div>
          )}

          {/* ─── DONE ─── */}
          {step === "done" && (
            <motion.div
              key="done"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Check className="h-10 w-10 stroke-[3]" />
              </motion.div>
              <h1 className="mt-6 font-display text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                You&apos;re all set!
              </h1>
              <p className="mt-2 text-base text-slate-500">
                Welcome, <span className="font-semibold text-slate-700 dark:text-white">{name || "shopper"}</span>. Let&apos;s get your groceries.
              </p>

              <Button
                onClick={() => { router.push(safeCallback); router.refresh(); }}
                size="lg"
                className="mt-8 w-full rounded-2xl"
              >
                Start Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
