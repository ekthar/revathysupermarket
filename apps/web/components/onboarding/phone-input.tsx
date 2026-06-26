"use client";

import { Input } from "@/components/ui/input";

export function PhoneInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex h-14 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/30 dark:border-white/10 dark:bg-white/5">
      <span className="flex h-full items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white">
        +91
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="Enter mobile number"
        className="h-full border-0 bg-transparent text-lg font-semibold shadow-none tracking-wide placeholder:text-slate-400 focus-visible:ring-0"
      />
    </div>
  );
}
