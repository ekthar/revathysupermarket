"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Reorder",
  leftLabel = "Dismiss",
  className = ""
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);

  // Background color based on swipe direction
  const bgLeft = useTransform(x, [-150, 0], [1, 0]);
  const bgRight = useTransform(x, [0, 150], [0, 1]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    setSwiping(false);
    if (info.offset.x > 100 && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -100 && onSwipeLeft) {
      onSwipeLeft();
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background actions revealed on swipe */}
      <div className="absolute inset-0 flex">
        {/* Left side (revealed on swipe right) - Reorder */}
        <motion.div
          style={{ opacity: bgRight }}
          className="flex-1 flex items-center justify-start pl-5 bg-primary rounded-2xl"
        >
          <div className="flex items-center gap-2 text-white">
            <RotateCcw className="h-5 w-5" />
            <span className="text-[12px] font-bold">{rightLabel}</span>
          </div>
        </motion.div>

        {/* Right side (revealed on swipe left) - Dismiss */}
        <motion.div
          style={{ opacity: bgLeft }}
          className="flex-1 flex items-center justify-end pr-5 bg-red-500 rounded-2xl"
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-[12px] font-bold">{leftLabel}</span>
            <X className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        style={{ x }}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
