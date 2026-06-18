"use client";

import { Copy, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/toast-provider";

export function DeliveryOtpCard({ otp }: { otp: string }) {
  const { showToast } = useToast();

  async function copyOtp() {
    await navigator.clipboard.writeText(otp);
    showToast("OTP copied!", "success");
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wide text-primary">Delivery OTP</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-mono text-3xl font-black tracking-[0.25em] text-slate-900 dark:text-white">
          {otp}
        </p>
        <button
          type="button"
          onClick={copyOtp}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary transition active:scale-95 dark:bg-white/10"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">
        Share this code only with the delivery person at your door.
      </p>
    </motion.div>
  );
}
