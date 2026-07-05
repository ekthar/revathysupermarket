"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";

const TIP_AMOUNTS = [20, 30, 50];

interface TipSelectorProps {
  tipAmount: number;
  onTipChange: (amount: number) => void;
}

export function TipSelector({ tipAmount, onTipChange }: TipSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  function selectPreset(amount: number) {
    setIsCustom(false);
    setCustomValue("");
    onTipChange(tipAmount === amount ? 0 : amount);
  }

  function enableCustom() {
    setIsCustom(true);
    onTipChange(0);
  }

  function handleCustomChange(value: string) {
    const sanitized = value.replace(/[^0-9]/g, "");
    setCustomValue(sanitized);
    const num = Number(sanitized);
    onTipChange(Number.isFinite(num) && num >= 0 ? num : 0);
  }

  return (
    <section className="rounded-2xl border border-neutral-100 bg-white p-4 card-shadow dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="text-xl" role="img" aria-label="Delivery rider">
          🛵
        </span>
        <div>
          <h2 className="text-sm font-black text-neutral-900 dark:text-white">Thank your delivery partner</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            100% of tip goes to your rider
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {TIP_AMOUNTS.map((amount) => {
          const isSelected = !isCustom && tipAmount === amount;
          return (
            <motion.button
              key={amount}
              type="button"
              onClick={() => selectPreset(amount)}
              whileTap={tapScale.subtle}
              className={`relative h-11 rounded-xl text-sm font-bold transition-colors ${
                isSelected
                  ? "bg-black text-white shadow-md"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="tip-highlight"
                  className="absolute inset-0 rounded-xl bg-black"
                  transition={springs.snappy}
                />
              )}
              <span className="relative z-10">{"\u20B9"}{amount}</span>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          onClick={enableCustom}
          whileTap={{ scale: 0.92 }}
          className={`h-11 rounded-xl text-sm font-bold transition-colors ${
            isCustom
              ? "bg-black text-white shadow-md"
              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          }`}
        >
          Custom
        </motion.button>
      </div>

      {isCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
              {"\u20B9"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter amount"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background pl-7 pr-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20"
              maxLength={4}
            />
          </div>
        </motion.div>
      )}

      {tipAmount > 0 && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs font-semibold text-secondary-600 dark:text-secondary-400"
        >
          You are tipping {"\u20B9"}{tipAmount} to your delivery partner
        </motion.p>
      )}
    </section>
  );
}
