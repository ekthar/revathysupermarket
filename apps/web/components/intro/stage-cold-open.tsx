"use client";

import { motion } from "framer-motion";

/**
 * Stage 1 — Cinematic Black Cold Open (0.0–1.2s)
 * 
 * Pure black with a faint vignette breathing effect and
 * a single 1px horizontal "film slit" line scaling from 0→100% width.
 * Uses GPU-only transforms (transform, opacity).
 */
export function StageColdOpen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-black flex items-center justify-center"
    >
      {/* Vignette breathing overlay */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Film slit line — scales from 0 to 100% width */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          duration: 1.0,
          ease: [0.77, 0, 0.18, 1], // cubic-bezier(.77,0,.18,1)
          delay: 0.2,
        }}
        className="absolute h-px w-full bg-white/60"
        style={{ transformOrigin: "center", willChange: "transform, opacity" }}
      />
    </motion.div>
  );
}
