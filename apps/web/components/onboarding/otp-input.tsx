"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { durations } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function OtpInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function setDigit(index: number, digit: string) {
    const next = value.split("");
    next[index] = digit;
    const clean = next.join("").replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  return (
    <div className="flex justify-center gap-2.5">
      {digits.map((digit, index) => {
        const filled = digit.trim() !== "";
        return (
          <motion.input
            key={index}
            ref={(node) => { refs.current[index] = node; }}
            value={digit.trim()}
            inputMode="numeric"
            maxLength={1}
            animate={filled ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: durations.instant }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              onChange(pasted);
              refs.current[Math.min(pasted.length, 5)]?.focus();
            }}
            onChange={(e) => setDigit(index, e.target.value.replace(/\D/g, "").slice(-1))}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[index].trim() && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            className={cn(
              "h-14 w-11 rounded-xl border-2 bg-white text-center text-xl font-black outline-none transition-all dark:bg-white/5 sm:h-16 sm:w-14 sm:text-2xl",
              filled
                ? "border-primary shadow-sm"
                : "border-slate-200 dark:border-white/10",
              "focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          />
        );
      })}
    </div>
  );
}
