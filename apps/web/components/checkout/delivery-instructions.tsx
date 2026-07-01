"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const QUICK_INSTRUCTIONS = [
  { id: "ring_bell", label: "Ring bell", emoji: "🔔" },
  { id: "leave_at_door", label: "Leave at door", emoji: "🚪" },
  { id: "call_before", label: "Call before delivery", emoji: "📞" },
  { id: "do_not_ring", label: "Do not ring bell", emoji: "🤫" },
];

interface DeliveryInstructionsProps {
  instructions: string;
  onInstructionsChange: (value: string) => void;
}

export function DeliveryInstructions({ instructions, onInstructionsChange }: DeliveryInstructionsProps) {
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState("");

  function buildInstructions(chips: Set<string>, text: string) {
    const chipLabels = QUICK_INSTRUCTIONS
      .filter((chip) => chips.has(chip.id))
      .map((chip) => chip.label);
    const parts = [...chipLabels];
    if (text.trim()) parts.push(text.trim());
    return parts.join(". ");
  }

  function toggleChip(chipId: string) {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) {
        next.delete(chipId);
      } else {
        next.add(chipId);
      }
      onInstructionsChange(buildInstructions(next, customText));
      return next;
    });
  }

  function handleCustomText(value: string) {
    setCustomText(value);
    onInstructionsChange(buildInstructions(selectedChips, value));
  }

  return (
    <section className="rounded-2xl border border-neutral-100 bg-white p-4 card-shadow dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="text-xl" role="img" aria-label="Instructions">
          📋
        </span>
        <h2 className="text-sm font-black text-neutral-900 dark:text-white">Delivery instructions</h2>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_INSTRUCTIONS.map((chip) => {
          const isSelected = selectedChips.has(chip.id);
          return (
            <motion.button
              key={chip.id}
              type="button"
              onClick={() => toggleChip(chip.id)}
              whileTap={{ scale: 0.92 }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                isSelected
                  ? "bg-black text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3">
        <textarea
          placeholder="Add custom instructions (optional)"
          value={customText}
          onChange={(e) => handleCustomText(e.target.value)}
          maxLength={150}
          rows={2}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
        />
        <p className="mt-1 text-right text-micro text-neutral-400">
          {instructions.length}/200
        </p>
      </div>
    </section>
  );
}
