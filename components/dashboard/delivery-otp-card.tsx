"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeliveryOtpCard({ otp }: { otp: string }) {
  async function copyOtp() {
    await navigator.clipboard.writeText(otp);
  }

  return (
    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
      <p className="flex items-center gap-2 text-xs font-black uppercase"><ShieldCheck className="h-4 w-4" />Your Delivery OTP</p>
      <p className="mt-1 text-2xl font-black tracking-[0.2em]">{otp}</p>
      <p className="mt-1 text-xs font-bold">Share only with the delivery person at your door.</p>
      <Button type="button" size="sm" onClick={copyOtp} className="mt-3">Copy OTP</Button>
    </div>
  );
}
