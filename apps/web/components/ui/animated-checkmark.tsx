"use client";

import { motion } from "framer-motion";

// Animated SVG checkmark with path draw animation
export function AnimatedCheckmark({
  size = 80,
  strokeWidth = 3,
  delay = 0.3
}: {
  size?: number;
  strokeWidth?: number;
  delay?: number;
}) {
  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: delay,
          type: "spring",
          duration: 0.8,
          bounce: 0
        },
        opacity: { delay: delay, duration: 0.01 }
      }
    }
  };

  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: delay + 0.4,
          type: "spring",
          duration: 0.5,
          bounce: 0.3
        },
        opacity: { delay: delay + 0.4, duration: 0.01 }
      }
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: delay * 0.5, type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        className="drop-shadow-lg"
      >
        {/* Background circle */}
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="#1a1a1a"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay * 0.3, type: "spring", stiffness: 300, damping: 20 }}
        />

        {/* Animated circle border */}
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          stroke="#ffffff"
          strokeWidth={strokeWidth * 0.5}
          strokeLinecap="round"
          fill="none"
          variants={circleVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Checkmark path */}
        <motion.path
          d="M24 42L34 52L56 30"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={checkVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Sparkle particles */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 40 + Math.cos(rad) * 44;
          const y = 40 + Math.sin(rad) * 44;
          return (
            <motion.circle
              key={angle}
              cx={x}
              cy={y}
              r={2}
              fill="#1a1a1a"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{
                delay: delay + 0.6 + i * 0.05,
                duration: 0.6,
                ease: "easeOut"
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

// Simple success ring animation (pulsing ring behind checkmark)
export function SuccessRing({ size = 120 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulsing rings */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-border"
        animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-border"
        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
      />

      {/* Center checkmark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedCheckmark size={size * 0.7} delay={0.2} />
      </div>
    </div>
  );
}
