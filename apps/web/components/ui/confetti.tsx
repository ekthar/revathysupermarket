"use client";

import { motion, useReducedMotion } from "framer-motion";

const colors = ["#0F8A5F", "#A7D129", "#C0265A", "#ffffff"];

export function Confetti({ active = true }: { active?: boolean }) {
  const reduceMotion = useReducedMotion();
  if (!active || reduceMotion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }).map((_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 80, x: "50vw", scale: 0.6 }}
          animate={{
            opacity: [0, 1, 0],
            y: [80, -120 - (index % 7) * 20],
            x: `${18 + ((index * 17) % 64)}vw`,
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 1.8, delay: index * 0.025, repeat: 1 }}
          className="absolute bottom-14 h-2 w-2 rounded-full"
          style={{ backgroundColor: colors[index % colors.length] }}
        />
      ))}
    </div>
  );
}
