"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, Phone, ShoppingBasket, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";
import { isCustomerRole, isDeliveryPartnerRole, isStaffLoginRole, roleLabel } from "@/lib/roles";
import { haptic } from "@/lib/haptics";
import { isNative } from "@/lib/native-bridge";
import { canUseBiometric, authenticateWithBiometric, getBiometricType, getSecureCredentials, setSecureCredentials, type BiometricType } from "@/lib/native-biometric";

type Mode = "login" | "register";

const highlights = ["Fresh local delivery", "COD & UPI on delivery", "Local service"];

export function LoginForm({
  callbackUrl = "/dashboard",
  initialMode = "login"
}: {
  callbackUrl?: string;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [register, setRegister] = useState({ name: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>("none");

  // Check if biometric login is available on this device
  useEffect(() => {
    if (isNative) {
      canUseBiometric().then((available) => {
        setBiometricAvailable(available);
        if (available) getBiometricType().then(setBiometricType);
      });
    }
  }, []);

  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("/admin") ? callbackUrl : "/dashboard";

  /** Attempt biometric login using stored credentials */
  async function handleBiometricLogin() {
    haptic("medium");
    setLoading(true);
    setMessage("");
    try {
      // Verify identity with Face ID / fingerprint
      const authenticated = await authenticateWithBiometric("Log in to your account");
      if (!authenticated) {
        setLoading(false);
        return;
      }

      // Retrieve stored credentials from secure keychain
      const credentials = await getSecureCredentials("revathysupermarket.vercel.app");
      if (!credentials) {
        setMessage("No saved login found. Please sign in with email first.");
        setLoading(false);
        return;
      }

      // Sign in with the stored credentials
      const loginType = await customerLogin(credentials.username, credentials.password);
      if (loginType === "delivery") {
        showToast(`Opening ${roleLabel("DELIVERY_PARTNER")} panel`, "success");
        return;
      }
      showToast("Welcome back!", "success");
      router.push(safeCallback);
      router.refresh();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Biometric login failed.";
      setMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  async function customerLogin(email: string, password: string) {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) throw new Error("Invalid email or password.");
    const session = await getSession();
    const role = session?.user?.role;
    if (isDeliveryPartnerRole(role)) {
      router.push("/delivery");
      router.refresh();
      return "delivery";
    }
    if (isStaffLoginRole(role)) {
      await signOut({ redirect: false });
      throw new Error("This is a staff account. Use Staff Login.");
    }
    if (!isCustomerRole(role)) {
      await signOut({ redirect: false });
      throw new Error("This account cannot use customer login.");
    }
    return "customer";
  }

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    haptic("medium");
    setLoading(true);
    setMessage("");
    try {
      const loginType = await customerLogin(login.email, login.password);
      // Save credentials for future biometric login
      if (biometricAvailable) {
        void setSecureCredentials("revathysupermarket.vercel.app", login.email, login.password);
      }
      if (loginType === "delivery") {
        showToast(`Opening ${roleLabel("DELIVERY_PARTNER")} panel`, "success");
        return;
      }
      showToast("Welcome back, customer", "success");
      router.push(safeCallback);
      router.refresh();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Login failed.";
      setMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    haptic("medium");
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(register)
    });
    const data = await readApiResponse<{ error?: string }>(response);

    if (!response.ok) {
      setLoading(false);
      setMessage(data.error ?? "Account could not be created.");
      return;
    }

    if (register.password !== register.confirmPassword) {
      setLoading(false);
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await customerLogin(register.email, register.password);
      showToast(`Account created. Welcome to ${SITE.name}`, "success");
      router.push(safeCallback);
      router.refresh();
    } catch {
      showToast("Account created. Please login.", "success");
      setMode("login");
      setLogin({ email: register.email, password: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-black p-5 text-white shadow-premium sm:p-8"
      >
        <div className="absolute -right-10 top-10 h-44 w-44 rounded-full bg-secondary-100 blur-3xl" />
        <div className="absolute -bottom-16 left-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="stay-light flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-black">
            <ShoppingBasket className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-wide text-secondary-400">{SITE.name}</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-6xl">
            Fresh groceries, made easy.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/82 sm:text-base">
            Create your account, save delivery details, track orders, and checkout faster from your local supermarket.
          </p>
          <div className="mt-6 grid gap-3">
            {highlights.map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-white/12 p-3 text-sm font-black backdrop-blur"
              >
                <CheckCircle2 className="h-5 w-5 text-secondary-400" />
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="rounded-xl border border-white/70 bg-white/95 p-4 shadow-premium backdrop-blur dark:border-white/10 dark:bg-neutral-900 sm:p-5">
        <div role="tablist" aria-label="Login or register" className="grid grid-cols-2 rounded-2xl bg-muted p-1">
          {[
            ["login", "Login"],
            ["register", "Create account"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => {
                setMode(value as Mode);
                setMessage("");
              }}
              className={cn(
                "h-11 rounded-xl text-sm font-black transition",
                mode === value ? "bg-background text-black shadow-sm" : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              onSubmit={submitLogin}
              className="mt-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-secondary-500">Welcome back</p>
                  <h2 className="font-display text-2xl font-black">Login to continue</h2>
                </div>
              </div>
              <AuthInput icon={Mail} label="Email" type="email" value={login.email} onChange={(value) => setLogin((current) => ({ ...current, email: value }))} />
              <AuthInput icon={LockKeyhole} label="Password" type="password" value={login.password} onChange={(value) => setLogin((current) => ({ ...current, password: value }))} />
              {message && <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{message}</p>}
              <Button className="mt-5 w-full bg-black text-white hover:bg-black/90" size="lg" disabled={loading}>
                {loading ? "Signing in" : "Login"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {/* Biometric login button — only shown on native devices with Face ID / fingerprint */}
              {biometricAvailable && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-2.5 h-12 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-200 transition hover:border-neutral-300 dark:hover:border-neutral-600 disabled:opacity-50 press"
                >
                  <Fingerprint className="h-5 w-5 text-emerald-600" />
                  {biometricType === "face" ? "Sign in with Face ID" : "Sign in with Fingerprint"}
                </button>
              )}
              <div className="mt-4 flex justify-between text-sm font-semibold">
                <button type="button" onClick={() => setMode("register")} className="text-black">Create account</button>
                <Link href="/forgot-password" className="text-black">Forgot password</Link>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <Link href="/admin/login" className="block rounded-2xl border border-border bg-background/70 p-3 text-center text-sm font-black text-black">
                  Staff member? Use Staff Login →
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              onSubmit={submitRegister}
              className="mt-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-secondary-500">New customer</p>
                  <h2 className="font-display text-2xl font-black">Create your account</h2>
                </div>
              </div>
              <AuthInput icon={UserRound} label="Full name" value={register.name} onChange={(value) => setRegister((current) => ({ ...current, name: value }))} />
              <AuthInput icon={Phone} label="Phone number" type="tel" placeholder="+91 XXXXXXXXXX" value={register.phone} onChange={(value) => setRegister((current) => ({ ...current, phone: value }))} />
              <AuthInput icon={Mail} label="Email" type="email" value={register.email} onChange={(value) => setRegister((current) => ({ ...current, email: value }))} />
              <AuthInput icon={LockKeyhole} label="Password" type="password" value={register.password} onChange={(value) => setRegister((current) => ({ ...current, password: value }))} />
              <AuthInput icon={LockKeyhole} label="Confirm password" type="password" value={register.confirmPassword} onChange={(value) => setRegister((current) => ({ ...current, confirmPassword: value }))} />
              {message && <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{message}</p>}
              <Button className="mt-5 w-full bg-black text-white hover:bg-black/90" size="lg" disabled={loading}>
                {loading ? "Creating account" : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button type="button" onClick={() => setMode("login")} className="mt-4 w-full text-sm font-bold text-black">
                Already have an account? Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function AuthInput({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange
}: {
  icon: React.ElementType;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  return (
    <label className="mt-4 block">
      <span className="text-sm font-bold">{label}</span>
      <span className="relative mt-2 block">
        <Icon className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
        <Input type={inputType} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} required className="h-12 rounded-2xl pl-11 pr-11" />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-3.5 text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
    </label>
  );
}
