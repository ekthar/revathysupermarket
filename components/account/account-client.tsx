"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { CheckCircle2, Chrome, Home, Phone, Save, Trash2 } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";

type Address = { id: string; label: string; houseName: string; street: string; landmark: string; pincode: string; isDefault: boolean };

export function AccountClient({ user, addresses }: { user: { name: string; email: string; phone: string }; addresses: Address[] }) {
  const [profile, setProfile] = useState(user);
  const [localAddresses, setLocalAddresses] = useState(addresses);
  const [message, setMessage] = useState("");
  const [phoneDraft, setPhoneDraft] = useState(user.phone);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, email: profile.email })
    });
    setMessage(response.ok ? "Profile saved." : "Profile update failed.");
  }

  async function makeDefault(id: string) {
    const response = await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setMessage(data.error ?? "Address update failed.");
      return;
    }
    setLocalAddresses((current) => current.map((address) => ({ ...address, isDefault: address.id === id })));
  }

  async function sendPhoneOtp() {
    const response = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneDraft })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setMessage(data.error ?? "Could not send OTP.");
      return;
    }
    setOtpSent(true);
    setMessage("Verification code sent on WhatsApp.");
  }

  async function verifyPhoneOtp() {
    const response = await fetch("/api/account/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneDraft, otp: phoneOtp })
    });
    const data = await readApiResponse<{ error?: string; user?: { phone: string | null } }>(response);
    if (!response.ok || !data.user) {
      setMessage(data.error ?? "Phone verification failed.");
      return;
    }
    setProfile((current) => ({ ...current, phone: data.user?.phone ?? phoneDraft }));
    setMessage("Phone number linked.");
  }

  async function deleteAccount() {
    const confirmed = window.confirm("Delete your account? Your past orders stay with the store, but your login profile will be removed.");
    if (!confirmed) return;
    const response = await fetch("/api/account/profile", { method: "DELETE" });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setMessage(data.error ?? "Account could not be deleted.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="mt-5 grid gap-5">
      <form onSubmit={saveProfile} className="grid gap-3 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
        <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold" placeholder="Name" />
        <input value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold" placeholder="Email" />
        <input value={profile.phone} disabled className="h-11 rounded-2xl border border-border bg-muted px-4 text-sm font-bold" placeholder="Phone" />
        {!profile.phone ? (
          <div className="grid gap-2 rounded-2xl bg-primary/10 p-3">
            <p className="flex items-center gap-2 text-sm font-black text-primary"><Phone className="h-4 w-4" />Link WhatsApp phone</p>
            <input value={phoneDraft} onChange={(event) => setPhoneDraft(event.target.value.replace(/\D/g, "").slice(0, 12))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold" placeholder="10-digit phone" />
            {otpSent ? <input value={phoneOtp} onChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold" placeholder="6-digit OTP" /> : null}
            <button type="button" onClick={otpSent ? verifyPhoneOtp : sendPhoneOtp} className="h-11 rounded-2xl bg-primary text-sm font-black text-white">
              {otpSent ? "Verify phone" : "Send WhatsApp OTP"}
            </button>
          </div>
        ) : (
          <p className="text-xs font-bold text-muted-foreground">Phone number is verified through WhatsApp OTP.</p>
        )}
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white"><Save className="h-4 w-4" />Save profile</button>
        <button type="button" onClick={() => signIn("google", { callbackUrl: "/account" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-black">
          <Chrome className="h-4 w-4" />
          Link Google
        </button>
      </form>
      <section className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
        <h2 className="font-display text-2xl font-black">Saved addresses</h2>
        <div className="mt-4 grid gap-3">
          {localAddresses.map((address) => (
            <article key={address.id} className="rounded-2xl bg-muted p-3">
              <div className="flex justify-between gap-3">
                <p className="font-black"><Home className="mr-2 inline h-4 w-4 text-primary" />{address.label}</p>
                {address.isDefault ? <span className="text-xs font-black text-primary"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Default</span> : null}
              </div>
              <p className="mt-1 text-sm">{address.houseName}, {address.street}, {address.landmark}, {address.pincode}</p>
              {!address.isDefault ? <button onClick={() => makeDefault(address.id)} className="mt-3 text-xs font-black text-primary">Make default</button> : null}
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-[1.75rem] border border-red-200 bg-red-50 p-4 shadow-soft dark:border-red-500/30 dark:bg-red-950/20">
        <h2 className="font-display text-2xl font-black text-red-700 dark:text-red-200">Delete account</h2>
        <p className="mt-2 text-sm font-bold text-red-700/80 dark:text-red-100/80">This removes your login profile and saved addresses. Store order records are retained for billing and operations.</p>
        <button type="button" onClick={deleteAccount} className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white">
          <Trash2 className="h-4 w-4" />
          Delete my account
        </button>
      </section>
      {message ? <p className="rounded-2xl bg-muted p-3 text-sm font-bold">{message}</p> : null}
    </div>
  );
}
