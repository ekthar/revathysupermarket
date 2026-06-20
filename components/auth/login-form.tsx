"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Phone, ShoppingBasket, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";
import { isCustomerRole, isDeliveryPartnerRole, isStaffLoginRole, roleLabel } from "@/lib/roles";

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
  const [register, setRegister] = useState({ name: "", phone: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("/admin") ? callbackUrl : "/dashboard";

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
    setLoading(true);
    setMessage("");
    try {
      const loginType = await customerLogin(login.email, login.password);
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
      showToast(nextMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      showToast(data.error ?? "Account could not be created", "error");
      return;
    }

    try {
      await customerLogin(register.email, register.password);
      showToast("Account created. Welcome to MSM", "success");
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
        className="relative overflow-hidden rounded-[2.25rem] bg-primary p-5 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.9)] sm:p-8"
      >
        <div className="absolute -right-10 top-10 h-44 w-44 rounded-full bg-lime-fresh/25 blur-3xl" />
        <div className="absolute -bottom-16 left-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-primary">
            <ShoppingBasket className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-wide text-lime-fresh">{SITE.name}</p>
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
                <CheckCircle2 className="h-5 w-5 text-lime-fresh" />
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="rounded-[2rem] border border-white/70 bg-card/95 p-4 shadow-soft backdrop-blur dark:border-white/10 sm:p-5">
        <div className="grid grid-cols-2 rounded-2xl bg-muted p-1">
          {[
            ["login", "Login"],
            ["register", "Create account"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value as Mode);
                setMessage("");
              }}
              className={cn(
                "h-11 rounded-xl text-sm font-black transition",
                mode === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
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
                  <p className="text-xs font-black uppercase text-primary">Welcome back</p>
                  <h2 className="font-display text-2xl font-black">Login to continue</h2>
                </div>
              </div>
              <AuthInput icon={Mail} label="Email" type="email" value={login.email} onChange={(value) => setLogin((current) => ({ ...current, email: value }))} />
              <AuthInput icon={LockKeyhole} label="Password" type="password" value={login.password} onChange={(value) => setLogin((current) => ({ ...current, password: value }))} />
              {message && <p className="mt-4 rounded-2xl bg-muted p-3 text-sm font-bold">{message}</p>}
              <Button className="mt-5 w-full" size="lg" disabled={loading}>
                {loading ? "Signing in" : "Login"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="mt-4 flex justify-between text-sm font-semibold">
                <button type="button" onClick={() => setMode("register")} className="text-primary">Create account</button>
                <Link href="/forgot-password" className="text-primary">Forgot password</Link>
              </div>
              <Link href="/admin/login" className="mt-4 block rounded-2xl border border-border bg-background/70 p-3 text-center text-sm font-black text-primary">
                Staff member? Use Staff Login
              </Link>
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-fresh text-slate-950">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-primary">New customer</p>
                  <h2 className="font-display text-2xl font-black">Create your account</h2>
                </div>
              </div>
              <AuthInput icon={UserRound} label="Full name" value={register.name} onChange={(value) => setRegister((current) => ({ ...current, name: value }))} />
              <AuthInput icon={Phone} label="Phone number" type="tel" value={register.phone} onChange={(value) => setRegister((current) => ({ ...current, phone: value }))} />
              <AuthInput icon={Mail} label="Email" type="email" value={register.email} onChange={(value) => setRegister((current) => ({ ...current, email: value }))} />
              <AuthInput icon={LockKeyhole} label="Password" type="password" value={register.password} onChange={(value) => setRegister((current) => ({ ...current, password: value }))} />
              {message && <p className="mt-4 rounded-2xl bg-muted p-3 text-sm font-bold">{message}</p>}
              <Button className="mt-5 w-full" size="lg" disabled={loading}>
                {loading ? "Creating account" : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button type="button" onClick={() => setMode("login")} className="mt-4 w-full text-sm font-bold text-primary">
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
  value,
  onChange
}: {
  icon: React.ElementType;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-bold">{label}</span>
      <span className="relative mt-2 block">
        <Icon className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
        <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required className="h-12 rounded-2xl pl-11" />
      </span>
    </label>
  );
}
