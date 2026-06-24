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

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = useCallback(async () => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: clean, role: "DELIVERY_PARTNER" }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send OTP"); setLoading(false); return; }
      setStep("otp"); setCountdown(30); setCanResend(false);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [phone]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 6) { setError("Enter 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const result = await signIn("phone-otp", { phone: phone.replace(/\D/g, ""), otp, name: "", redirect: false });
      if (result?.error) { setError("Invalid OTP"); setOtp(""); if (navigator.vibrate) navigator.vibrate([100, 50, 100]); setLoading(false); return; }
      window.location.href = "/delivery";
    } catch { setError("Verification failed"); }
    finally { setLoading(false); }
  }, [phone, otp]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {logoUrl ? <Image src={logoUrl} alt="Logo" width={56} height={56} className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover" /> : <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50"><Bike className="h-7 w-7 text-emerald-600 dark:text-emerald-400" /></div>}
          <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">Delivery Partner</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Login with your registered phone</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300"><Phone className="mb-2 inline h-4 w-4" /> Phone number</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                  <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} onKeyDown={(e) => e.key === "Enter" && sendOtp()} placeholder="9876543210" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-lg font-bold tracking-wide outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" autoFocus />
                </div>
                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm font-medium text-red-600">{error}</motion.p>}
                <button onClick={sendOtp} disabled={loading || phone.length < 10} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Send OTP <ArrowRight className="h-4 w-4" /></>}</button>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300"><Shield className="mb-2 inline h-4 w-4" /> Enter 6-digit OTP</label>
                <p className="mt-1 text-xs text-slate-500">Sent to +91 {phone}</p>
                <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setOtp(v); setError(""); if (v.length === 6) setTimeout(verifyOtp, 100); }} placeholder="● ● ● ● ● ●" className="mt-3 h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" autoFocus autoComplete="one-time-code" />
                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm font-medium text-red-600">{error}</motion.p>}
                <button onClick={verifyOtp} disabled={loading || otp.length < 6} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Verify & Login <ArrowRight className="h-4 w-4" /></>}</button>
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} className="text-sm font-bold text-slate-500">&larr; Change</button>
                  {canResend ? <button onClick={() => { setOtp(""); setCanResend(false); setCountdown(30); sendOtp(); }} className="text-sm font-bold text-emerald-600">Resend OTP</button> : <span className="text-sm font-bold text-slate-400">Resend in {countdown}s</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Not a delivery partner? <a href="/login" className="font-bold text-emerald-600 hover:underline">Customer login</a></p>
      </motion.div>
    </main>
  );
}
