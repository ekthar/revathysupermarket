"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

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
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <motion.input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit.trim()}
          inputMode="numeric"
          maxLength={1}
          animate={digit.trim() ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            onChange(pasted);
            refs.current[Math.min(pasted.length, 5)]?.focus();
          }}
          onChange={(event) => setDigit(index, event.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index].trim() && index > 0) refs.current[index - 1]?.focus();
          }}
          className="h-14 w-12 rounded-2xl border-2 border-border bg-background/90 text-center text-2xl font-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 sm:h-16 sm:w-14"
        />
      ))}
    </div>
  );
}
