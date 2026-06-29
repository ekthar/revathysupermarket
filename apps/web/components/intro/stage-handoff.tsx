"use client";

import { motion } from "framer-motion";

/**
 * Stage 5 — Hero Hand-off (5.6–6.4s)
 * 
 * The logo shrinks and morphs into the header logo position.
 * Background color animates from #000 → brand cream (#FFFBF5).
 * Uses layoutId-like shared element approach via scale/position animation.
 */
export function StageHandoff() {
  return (
    <motion.div
      initial={{ backgroundColor: "#000000" }}
      animate={{ backgroundColor: "#FFFBF5" }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {/* Logo shrinking to header position */}
      <motion.div
        initial={{ scale: 1, y: 0, opacity: 1 }}
        animate={{
          scale: 0.3,
          y: "-42vh",
          x: "-30vw",
          opacity: 0,
        }}
        transition={{
          duration: 0.7,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="relative"
        style={{ willChange: "transform, opacity" }}
      >
        <svg
          viewBox="0 0 200 60"
          className="w-48 h-auto"
          fill="none"
          aria-hidden="true"
        >
          <motion.text
            x="100"
            y="45"
            textAnchor="middle"
            fill="#050505"
            fontSize="48"
            fontWeight="900"
            letterSpacing="-2"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.7, 1] }}
          >
            MSM
          </motion.text>
        </svg>
      </motion.div>

      {/* Expanding radial reveal of page content */}
      <motion.div
        initial={{ scale: 0, borderRadius: "50%" }}
        animate={{ scale: 20, borderRadius: "0%" }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="absolute w-20 h-20 bg-background"
        style={{ willChange: "transform" }}
      />
    </motion.div>
  );
}
