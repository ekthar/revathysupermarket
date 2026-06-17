"use client";

import { useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";

const staffRoles = new Set(["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF"]);

export function AdminLoginForm({ callbackUrl = "/admin" }: { callbackUrl?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setLoading(false);
      setMessage("Invalid staff email or password.");
      showToast("Invalid staff login", "error");
      return;
    }

    const session = await getSession();
    if (!staffRoles.has(String(session?.user?.role ?? ""))) {
      await signOut({ redirect: false });
      setLoading(false);
      setMessage("This login is only for Revathy Supermarket admin users.");
      showToast("Admin access required", "error");
      return;
    }

    showToast("Welcome back, admin", "success");
    router.push(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
    router.refresh();
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submit}
      className="rounded-[2rem] border border-white/70 bg-card/95 p-5 shadow-soft backdrop-blur dark:border-white/10 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-primary">Secure login</p>
          <h2 className="font-display text-2xl font-black">Staff access</h2>
        </div>
      </div>
      <label className="mt-6 block">
        <span className="text-sm font-bold">Admin email</span>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 h-12 rounded-2xl" />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-bold">Password</span>
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-2 h-12 rounded-2xl" />
      </label>
      {message && <p className="mt-4 rounded-2xl bg-muted p-3 text-sm font-bold">{message}</p>}
      <Button className="mt-5 w-full" size="lg" disabled={loading}>
        <LockKeyhole className="h-4 w-4" />
        {loading ? "Checking access" : "Enter admin panel"}
      </Button>
    </motion.form>
  );
}
