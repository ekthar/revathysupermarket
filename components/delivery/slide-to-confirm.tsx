"use client";

import { useRef, useState, useCallback } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface SlideToConfirmProps {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

/**
 * Zepto/Swiggy-style slide-to-confirm button.
 * Full-width track with a draggable thumb. Must drag >85% to trigger.
 * Haptic feedback on complete. Resets smoothly on incomplete slide.
 */
export function SlideToConfirm({ label = "Slide to confirm", onConfirm, disabled = false }: SlideToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);

  const getMaxX = useCallback(() => {
    if (!containerRef.current) return 250;
    return containerRef.current.offsetWidth - 64; // track width minus thumb
  }, []);

  // Progress from 0 to 1
  const progress = useTransform(x, [0, getMaxX()], [0, 1]);
  const bgOpacity = useTransform(progress, [0, 0.5, 1], [0.1, 0.3, 0.6]);
  const labelOpacity = useTransform(progress, [0, 0.3], [1, 0]);
  const checkScale = useTransform(progress, [0.8, 1], [0, 1]);

  function handleDragEnd() {
    const current = x.get();
    const max = getMaxX();

    if (current >= max * 0.85) {
      // Confirmed!
      animate(x, max, { type: "spring", stiffness: 400, damping: 30 });
      setConfirmed(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
      setTimeout(onConfirm, 200);
    } else {
      // Reset
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }

  if (confirmed) {
    return (
      <div className="flex h-16 items-center justify-center rounded-2xl bg-emerald-500">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <CheckCircle2 className="h-7 w-7 text-white" />
        </motion.div>
        <span className="ml-2 font-black text-white">Confirmed!</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex h-16 items-center overflow-hidden rounded-2xl ${disabled ? "bg-slate-200 dark:bg-slate-800" : "bg-slate-900 dark:bg-slate-100"}`}
    >
      {/* Fill background */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-emerald-500"
        style={{ opacity: bgOpacity }}
      />

      {/* Label */}
      <motion.span
        style={{ opacity: labelOpacity }}
        className={`absolute inset-0 flex items-center justify-center text-sm font-black ${disabled ? "text-slate-400" : "text-white/70 dark:text-slate-900/70"}`}
      >
        {label} &rarr;
      </motion.span>

      {/* Check icon at end */}
      <motion.div
        style={{ scale: checkScale }}
        className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500"
      >
        <CheckCircle2 className="h-5 w-5 text-white" />
      </motion.div>

      {/* Draggable Thumb */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: getMaxX() }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={disabled ? {} : { scale: 1.05 }}
        className={`relative z-10 ml-1 flex h-14 w-14 cursor-grab items-center justify-center rounded-xl shadow-lg active:cursor-grabbing ${
          disabled ? "bg-slate-300 dark:bg-slate-600" : "bg-emerald-500"
        }`}
      >
        <ChevronRight className={`h-6 w-6 ${disabled ? "text-slate-500" : "text-white"}`} />
        <ChevronRight className={`-ml-4 h-6 w-6 ${disabled ? "text-slate-500" : "text-white/50"}`} />
      </motion.div>
    </div>
  );
}
