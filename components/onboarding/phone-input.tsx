"use client";

import { Input } from "@/components/ui/input";

export function PhoneInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-black uppercase text-primary">WhatsApp number</span>
      <span className="mt-3 flex h-16 items-center rounded-[1.5rem] border border-border bg-background/90 px-3 shadow-soft focus-within:ring-2 focus-within:ring-primary">
        <span className="rounded-2xl bg-primary/10 px-3 py-2 text-lg font-black text-primary">+91</span>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="9876543210"
          className="h-14 border-0 bg-transparent pl-3 text-2xl font-black tracking-[0.12em] shadow-none focus-visible:ring-0"
        />
      </span>
    </label>
  );
}
