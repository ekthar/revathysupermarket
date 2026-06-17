"use client";

import { useState } from "react";
import { CheckCircle2, Home, Save } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";

type Address = { id: string; label: string; houseName: string; street: string; landmark: string; pincode: string; isDefault: boolean };

export function AccountClient({ user, addresses }: { user: { name: string; email: string; phone: string }; addresses: Address[] }) {
  const [profile, setProfile] = useState(user);
  const [localAddresses, setLocalAddresses] = useState(addresses);
  const [message, setMessage] = useState("");

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

  return (
    <div className="mt-5 grid gap-5">
      <form onSubmit={saveProfile} className="grid gap-3 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
        <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold" placeholder="Name" />
        <input value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold" placeholder="Email" />
        <input value={profile.phone} disabled className="h-11 rounded-2xl border border-border bg-muted px-4 text-sm font-bold" placeholder="Phone" />
        <p className="text-xs font-bold text-muted-foreground">Phone changes require OTP verification and an SMS provider before they can be enabled.</p>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white"><Save className="h-4 w-4" />Save profile</button>
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
      {message ? <p className="rounded-2xl bg-muted p-3 text-sm font-bold">{message}</p> : null}
    </div>
  );
}
