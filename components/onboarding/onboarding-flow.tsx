"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle2, Chrome, LocateFixed, LockKeyhole, Mail, MapPin, PartyPopper, ShoppingBasket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/onboarding/otp-input";
import { PhoneInput } from "@/components/onboarding/phone-input";
import { ProgressDots } from "@/components/onboarding/progress-dots";
import { readApiResponse } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export function OnboardingFlow({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [emailAuth, setEmailAuth] = useState({ name: "", email: "", password: "" });
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("/admin") ? callbackUrl : "/dashboard";
  const progressIndex = Math.max(0, Math.min(4, step - 2));

  useEffect(() => {
    if (step !== 1) return;
    const timeout = window.setTimeout(() => setStep(2), 2000);
    return () => window.clearTimeout(timeout);
  }, [step]);

  useEffect(() => {
    if (step !== 3 || timer <= 0) return;
    const interval = window.setInterval(() => setTimer((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (step !== 6) return;
    window.localStorage.setItem("onboarding-complete", "true");
    const timeout = window.setTimeout(() => {
      router.push(safeCallback);
      router.refresh();
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [router, safeCallback, step]);

  const variants = useMemo<Variants>(() => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -48 }
  }), [reduceMotion]);

  async function sendOtp() {
    if (phone.length !== 10) return;
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not send OTP.");
      return;
    }
    setTimer(30);
    setStep(3);
  }

  async function emailSignUp() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailAuth)
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setLoading(false);
      setMessage(data.error ?? "Email account could not be created.");
      return;
    }
    const result = await signIn("staff-credentials", {
      email: emailAuth.email,
      password: emailAuth.password,
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setMessage("Account created. Please login with email and password.");
      return;
    }
    window.localStorage.setItem("onboarding-complete", "true");
    router.push(safeCallback);
    router.refresh();
  }

  function skipAuth() {
    window.localStorage.setItem("onboarding-complete", "skipped");
    router.push("/products");
  }

  async function verifyOtp() {
    if (otp.length !== 6) return;
    setLoading(true);
    setMessage("");
    const result = await signIn("phone-otp", { phone, otp, redirect: false });
    setLoading(false);
    if (result?.error) {
      setMessage("Verification code is incorrect or expired.");
      return;
    }
    setStep(4);
  }

  async function saveName() {
    if (name.trim().length < 2) return;
    setLoading(true);
    await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    }).catch(() => null);
    setLoading(false);
    setStep(5);
  }

  async function reverseGeocode(latitude: number, longitude: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      return typeof data?.display_name === "string" ? data.display_name : "";
    } catch {
      return "";
    }
  }

  function useLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Location access is not available. Enter your pincode manually.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCoords({ latitude, longitude });
        const resolved = await reverseGeocode(latitude, longitude);
        setAddress(resolved || `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLoading(false);
      },
      () => {
        setMessage("Location permission was denied. Enter your pincode manually.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(167,209,41,0.34),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(15,138,95,0.24),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,244,0.92))] px-4 text-foreground dark:bg-[radial-gradient(circle_at_20%_20%,rgba(167,209,41,0.22),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(15,138,95,0.24),transparent_30%),linear-gradient(135deg,#020617,#0f172a)]">
      <Confetti active={step === 1 || step === 6} />
      <div className="mx-auto flex min-h-screen max-w-md flex-col py-5">
        <div className="grid h-12 grid-cols-[48px_1fr_48px] items-center">
          {step > 2 && step < 6 ? (
            <button type="button" onClick={() => setStep((current) => Math.max(2, current - 1) as Step)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-soft">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : <span />}
          {step > 1 && step < 6 ? <ProgressDots current={progressIndex} /> : <span />}
        </div>

        <section className="flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <Screen key="welcome" variants={variants} center className="text-center text-white">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-primary shadow-premium">
                  <ShoppingBasket className="h-12 w-12" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-black">Revathy</h1>
                <p className="mt-3 text-lg font-bold text-white/90">Fresh groceries at your doorstep</p>
              </Screen>
            ) : null}

            {step === 2 ? (
              <Screen key="phone" variants={variants}>
                <StepIcon icon={Sparkles} />
                <h1 className="font-display text-4xl font-black">Let&apos;s get you started</h1>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">Enter your WhatsApp number to continue.</p>
                <div className="mt-8">
                  <PhoneInput value={phone} onChange={setPhone} />
                </div>
                <p className="mt-4 text-center text-xs font-bold text-muted-foreground">We&apos;ll send a verification code via WhatsApp.</p>
                <div className="mt-6 grid gap-3">
                  <Button type="button" size="lg" onClick={sendOtp} disabled={loading || phone.length !== 10} className="w-full">
                    {loading ? "Sending code" : "Continue with WhatsApp"}
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => signIn("google", { callbackUrl: safeCallback })} className="w-full">
                    <Chrome className="h-4 w-4" />
                    Continue with Google
                  </Button>
                  <button type="button" onClick={() => setShowEmailAuth((current) => !current)} className="h-11 rounded-2xl border border-border bg-background/80 text-sm font-black text-primary">
                    Use email and password
                  </button>
                  <button type="button" onClick={skipAuth} className="text-sm font-black text-muted-foreground">
                    Skip for now
                  </button>
                </div>
                <AnimatePresence>
                  {showEmailAuth ? (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="mt-5 grid gap-3 rounded-[1.5rem] border border-border bg-card/95 p-3">
                      <IconInput icon={Sparkles} placeholder="Full name" value={emailAuth.name} onChange={(value) => setEmailAuth((current) => ({ ...current, name: value }))} />
                      <IconInput icon={Mail} placeholder="Email" type="email" value={emailAuth.email} onChange={(value) => setEmailAuth((current) => ({ ...current, email: value }))} />
                      <IconInput icon={LockKeyhole} placeholder="Password" type="password" value={emailAuth.password} onChange={(value) => setEmailAuth((current) => ({ ...current, password: value }))} />
                      {message ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{message}</p> : null}
                      <Button type="button" onClick={emailSignUp} disabled={loading || emailAuth.name.length < 2 || emailAuth.password.length < 8}>
                        Create email account
                      </Button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Screen>
            ) : null}

            {step === 3 ? (
              <Screen key="otp" variants={variants}>
                <StepIcon icon={CheckCircle2} />
                <h1 className="font-display text-4xl font-black">Check your WhatsApp</h1>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">We sent a 6-digit code to +91 {phone}.</p>
                <div className="mt-8">
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
                {message ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">{message}</p> : null}
                <Button type="button" size="lg" onClick={verifyOtp} disabled={loading || otp.length !== 6} className="mt-6 w-full">
                  {loading ? "Verifying" : "Verify OTP"}
                </Button>
                <button type="button" onClick={sendOtp} disabled={timer > 0 || loading} className="mt-5 w-full text-sm font-black text-primary disabled:text-muted-foreground">
                  {timer > 0 ? `Resend code in 0:${String(timer).padStart(2, "0")}` : "Resend via WhatsApp"}
                </button>
              </Screen>
            ) : null}

            {step === 4 ? (
              <Screen key="name" variants={variants}>
                <StepIcon icon={Sparkles} />
                <h1 className="font-display text-4xl font-black">What should we call you?</h1>
                {name ? <p className="mt-5 rounded-[1.5rem] bg-primary/10 p-4 text-center text-2xl font-black text-primary">Hi, {name}!</p> : null}
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Revathy" className="mt-8 h-16 rounded-[1.5rem] text-2xl font-black" />
                <Button type="button" size="lg" onClick={saveName} disabled={loading || name.trim().length < 2} className="mt-6 w-full">
                  Continue
                </Button>
              </Screen>
            ) : null}

            {step === 5 ? (
              <Screen key="location" variants={variants}>
                <StepIcon icon={MapPin} />
                <h1 className="font-display text-4xl font-black">Where should we deliver?</h1>
                <div className="mt-8 rounded-[2rem] border border-white/70 bg-card/95 p-6 text-center shadow-soft dark:border-white/10">
                  <LocateFixed className="mx-auto h-16 w-16 text-primary" />
                  <p className="mt-4 text-sm font-bold text-muted-foreground">Allow location for faster address setup.</p>
                </div>
                {address ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/95 shadow-soft">
                    {coords ? (
                      <iframe
                        title="Delivery address preview"
                        src={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=15&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-28 w-full border-0"
                      />
                    ) : null}
                    <p className="p-3 text-sm font-bold text-primary">{address}</p>
                  </div>
                ) : null}
                {message ? <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">{message}</p> : null}
                <Button type="button" size="lg" onClick={useLocation} disabled={loading} className="mt-6 w-full">
                  {loading ? "Finding location" : "Allow Location"}
                </Button>
                <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter pincode or address manually" className="mt-3 h-14 rounded-2xl" />
                <button type="button" onClick={() => setStep(6)} className="mt-5 w-full text-sm font-black text-primary">
                  {address ? "Continue" : "Skip for now"}
                </button>
              </Screen>
            ) : null}

            {step === 6 ? (
              <Screen key="done" variants={variants} center className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-lime-fresh text-slate-950 shadow-premium">
                  <PartyPopper className="h-12 w-12" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-black">You&apos;re all set!</h1>
                <p className="mt-3 text-lg font-bold text-muted-foreground">Welcome, {name || "shopper"}</p>
                {address ? <p className="mt-6 rounded-[1.5rem] bg-card/95 p-4 text-sm font-bold shadow-soft">{address}</p> : null}
                <Button type="button" size="lg" onClick={() => router.push(safeCallback)} className="mt-8 w-full animate-bounce">
                  Start Shopping
                </Button>
              </Screen>
            ) : null}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}

function Screen({
  children,
  variants,
  center,
  className
}: {
  children: React.ReactNode;
  variants: Variants;
  center?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn("w-full", center ? "text-center" : "", className)}
    >
      {children}
    </motion.div>
  );
}

function StepIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
      <Icon className="h-7 w-7" />
    </span>
  );
}

function IconInput({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 rounded-2xl pl-11" />
    </label>
  );
}
