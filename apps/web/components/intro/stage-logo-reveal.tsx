"use client";

import { motion } from "framer-motion";

/**
 * Stage 2 — Logo Reveal (1.2–3.0s)
 * 
 * SVG path-draw of the MSM logo with:
 * - Mask wipe from left
 * - Subtle chromatic-aberration shadow that settles to 0
 * - Particle dust drifting upward (CSS-only, GPU-composited)
 */
export function StageLogoReveal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-black flex items-center justify-center"
    >
      {/* Particle dust — lightweight CSS animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: `${20 + Math.random() * 60}%`,
              y: `${60 + Math.random() * 30}%`,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              y: `${-10 - Math.random() * 20}%`,
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0.5],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: 0.2 + Math.random() * 0.8,
              ease: "easeOut",
            }}
            className="absolute w-1 h-1 rounded-full bg-white/40"
            style={{ willChange: "transform, opacity" }}
          />
        ))}
      </div>

      {/* Logo SVG with path draw + chromatic aberration */}
      <div className="relative">
        {/* Chromatic aberration layers */}
        <motion.div
          initial={{ x: -3, opacity: 0.5 }}
          animate={{ x: 0, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ filter: "hue-rotate(-40deg)", willChange: "transform, opacity" }}
        >
          <MSMLogo className="text-red-400/50" />
        </motion.div>
        <motion.div
          initial={{ x: 3, opacity: 0.5 }}
          animate={{ x: 0, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ filter: "hue-rotate(40deg)", willChange: "transform, opacity" }}
        >
          <MSMLogo className="text-blue-400/50" />
        </motion.div>

        {/* Main logo with mask wipe */}
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ willChange: "clip-path" }}
        >
          <MSMLogo className="text-white" />
        </motion.div>
      </div>

      {/* Subtle glow behind logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.3, scale: 1.2 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute w-40 h-40 rounded-full bg-white/10 blur-3xl"
        style={{ willChange: "transform, opacity" }}
      />
    </motion.div>
  );
}

/** SVG MSM Logo — simple bold text path for the intro */
function MSMLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={`w-48 h-auto ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <motion.text
        x="100"
        y="45"
        textAnchor="middle"
        className="font-display"
        fill="currentColor"
        fontSize="48"
        fontWeight="900"
        letterSpacing="-2"
        initial={{ strokeDasharray: 400, strokeDashoffset: 400 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        stroke="currentColor"
        strokeWidth="1"
      >
        MSM
      </motion.text>
    </svg>
  );
}
