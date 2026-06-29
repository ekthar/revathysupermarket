"use client";

import { motion } from "framer-motion";

const TAGLINE = "Fresh from Kerala. Delivered in minutes.";
const CHAR_DELAY_MS = 18; // 18ms stagger per character

/**
 * Stage 3 — Tagline Typewriter (3.0–4.2s)
 * 
 * Characters stagger at 18ms intervals with a cursor blink,
 * then the whole text fades slightly. GPU-only transforms.
 */
export function StageTagline() {
  const chars = TAGLINE.split("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-black flex items-center justify-center px-8"
    >
      <div className="relative text-center">
        {/* Typewriter text */}
        <p className="font-display text-xl sm:text-2xl font-bold text-white leading-relaxed inline" aria-label={TAGLINE}>
          {chars.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.05,
                delay: i * (CHAR_DELAY_MS / 1000),
                ease: "easeOut",
              }}
              style={{ willChange: "transform, opacity" }}
            >
              {char}
            </motion.span>
          ))}
        </p>

        {/* Blinking cursor */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 0.8,
            repeat: 3,
            delay: chars.length * (CHAR_DELAY_MS / 1000),
          }}
          className="inline-block w-0.5 h-6 bg-white ml-1 align-middle"
        />

        {/* Subtitle fade in */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-4 text-sm text-white/50 font-medium"
        >
          MSM Supermarket
        </motion.p>
      </div>
    </motion.div>
  );
}
