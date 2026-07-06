"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { AlertTriangle, CheckCircle2, Chrome, Download, Home, Phone, Plus, Save, Trash2, X } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { useDeleteAddress, useMakeDefaultAddress } from "@/lib/queries/addresses";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";

type Address = { id: string; label: string; houseName: string; street: string; landmark: string; pincode: string; isDefault: boolean };

function ConfirmModal({ title, description, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }: {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex items-start gap-3">
          {danger && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
          <div>
            <h3 id="modal-title" className="font-display text-lg font-black">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold">
            <X className="h-4 w-4" />Cancel
          </button>
          <button onClick={onConfirm} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountClient({ user, addresses }: { user: { name: string; email: string; phone: string }; addresses: Address[] }) {
  const [profile, setProfile] = useState(user);
  const [localAddresses, setLocalAddresses] = useState(addresses);
  const [profileMessage, setProfileMessage] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneDraft, setPhoneDraft] = useState(user.phone);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [makeDefaultId, setMakeDefaultId] = useState<string | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const { showToast } = useToast();
  const deleteAddressMutation = useDeleteAddress();
  const makeDefaultMutation = useMakeDefaultAddress();

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, email: profile.email })
    });
    if (response.ok) {
      showToast("Profile saved.", "success");
      setProfileMessage("");
    } else {
      setProfileMessage("Profile update failed.");
    }
  }

  function confirmMakeDefault(id: string) {
    makeDefaultMutation.mutate(id, {
      onSuccess: () => {
        setLocalAddresses((current) => current.map((address) => ({ ...address, isDefault: address.id === id })));
        setMakeDefaultId(null);
      },
      onError: (error) => {
        showToast(error.message ?? "Address update failed.", "error");
        setMakeDefaultId(null);
      },
    });
  }

  function confirmDeleteAddress(id: string) {
    deleteAddressMutation.mutate(id, {
      onSuccess: () => {
        setLocalAddresses((current) => current.filter((address) => address.id !== id));
        setDeleteAddressId(null);
      },
      onError: () => {
        showToast("Failed to delete address", "error");
        setDeleteAddressId(null);
      },
    });
  }

  async function sendPhoneOtp() {
    const response = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneDraft })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      setPhoneMessage(data.error ?? "Could not send OTP.");
      return;
    }
    setOtpSent(true);
    setPhoneMessage("Verification code sent on WhatsApp.");
  }

  async function verifyPhoneOtp() {
    const response = await fetch("/api/account/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneDraft, otp: phoneOtp })
    });
    const data = await readApiResponse<{ error?: string; user?: { phone: string | null } }>(response);
    if (!response.ok || !data.user) {
      setPhoneMessage(data.error ?? "Phone verification failed.");
      return;
    }
    setProfile((current) => ({ ...current, phone: data.user?.phone ?? phoneDraft }));
    showToast("Phone number linked.", "success");
    setPhoneMessage("");
  }

  async function deleteAccount() {
    setShowDeleteAccount(false);
    const response = await fetch("/api/account/profile", { method: "DELETE" });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Account could not be deleted.", "error");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="mt-5 grid gap-5">
      {deleteAddressId && (
        <ConfirmModal
          title="Delete address?"
          description="This address will be permanently removed from your account."
          confirmLabel="Delete address"
          danger
          onConfirm={() => confirmDeleteAddress(deleteAddressId)}
          onCancel={() => setDeleteAddressId(null)}
        />
      )}
      {makeDefaultId && (
        <ConfirmModal
          title="Set as default address?"
          description="This address will be used by default at checkout."
          confirmLabel="Set as default"
          onConfirm={() => confirmMakeDefault(makeDefaultId)}
          onCancel={() => setMakeDefaultId(null)}
        />
      )}
      {showDeleteAccount && (
        <ConfirmModal
          title="Delete your account?"
          description="Your login profile and saved addresses will be removed. Past order records are retained for billing and operations."
          confirmLabel="Delete my account"
          danger
          onConfirm={deleteAccount}
          onCancel={() => setShowDeleteAccount(false)}
        />
      )}
      <form onSubmit={saveProfile} className="grid gap-3 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
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
            {phoneMessage && <p className="text-sm font-bold text-muted-foreground">{phoneMessage}</p>}
          </div>
        ) : (
          <p className="text-xs font-bold text-muted-foreground">Phone number is verified through WhatsApp OTP.</p>
        )}
        {profileMessage && <p className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{profileMessage}</p>}
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white"><Save className="h-4 w-4" />Save profile</button>
        <button type="button" onClick={() => signIn("google", { callbackUrl: "/account" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-black">
          <Chrome className="h-4 w-4" />
          Link Google
        </button>
      </form>
      <section className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black">Saved addresses</h2>
          <Link href="/account/addresses/new" className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white">
            <Plus className="h-3.5 w-3.5" />Add address
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {localAddresses.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved addresses. <Link href="/account/addresses/new" className="font-bold text-primary underline">Add one now</Link>.</p>
          )}
          {localAddresses.map((address) => (
            <article key={address.id} className="rounded-2xl bg-muted p-3">
              <div className="flex justify-between gap-3">
                <p className="font-black"><Home className="mr-2 inline h-4 w-4 text-primary" />{address.label}</p>
                {address.isDefault ? <span className="text-xs font-black text-primary"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Default</span> : null}
              </div>
              <p className="mt-1 text-sm">{address.houseName}, {address.street}, {address.landmark}, {address.pincode}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {!address.isDefault ? <button onClick={() => setMakeDefaultId(address.id)} className="text-xs font-black text-primary">Make default</button> : null}
                <button onClick={() => setDeleteAddressId(address.id)} className="text-xs font-black text-red-600">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-soft dark:border-red-500/30 dark:bg-red-950/20">
        <h2 className="font-display text-2xl font-black text-red-700 dark:text-red-200">Delete account</h2>
        <p className="mt-2 text-sm font-bold text-red-700/80 dark:text-red-100/80">This removes your login profile and saved addresses. Store order records are retained for billing and operations.</p>
        <button type="button" onClick={() => setShowDeleteAccount(true)} className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white">
          <Trash2 className="h-4 w-4" />
          Delete my account
        </button>
        <a href="/api/account/export" className="ml-2 mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-card px-4 text-sm font-black text-red-700 dark:text-red-200">
          <Download className="h-4 w-4" />
          Export my data
        </a>
      </section>
    </div>
  );
}
