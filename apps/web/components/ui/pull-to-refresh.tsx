"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 72;
const MAX_PULL = 120;
const RING_SIZE = 28;
const RING_STROKE = 2.5;

/**
 * PullToRefresh — iOS-native feel with progressive ring indicator.
 *
 * Visual states:
 * 1. Pulling (below threshold): ring progressively fills, faded
 * 2. Ready (at/above threshold): ring full, scales up, haptic fires, color change
 * 3. Refreshing: ring spins continuously
 * 4. Done: snaps back to 0
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [passedThreshold, setPassedThreshold] = useState(false);
  const startY = useRef(0);
  const isTracking = useRef(false);
  const didHaptic = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    isTracking.current = true;
    didHaptic.current = false;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTracking.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) {
      setPullDistance(0);
      setPassedThreshold(false);
      return;
    }

    // Rubber-band easing: diminishing returns past threshold
    const eased = dy <= THRESHOLD
      ? dy * 0.5
      : THRESHOLD * 0.5 + (dy - THRESHOLD) * 0.15;
    const clamped = Math.min(eased, MAX_PULL);
    setPullDistance(clamped);

    // Haptic feedback at threshold crossing (once per gesture)
    const nowPastThreshold = clamped >= THRESHOLD * 0.5;
    if (nowPastThreshold && !didHaptic.current) {
      haptic("medium");
      didHaptic.current = true;
    }
    setPassedThreshold(nowPastThreshold);
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    isTracking.current = false;
    if (passedThreshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5); // Hold at indicator position during refresh
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setPassedThreshold(false);
      }
    } else {
      setPullDistance(0);
      setPassedThreshold(false);
    }
  }, [passedThreshold, refreshing, onRefresh]);

  // Progress ring calculation (0 to 1)
  const progress = Math.min(pullDistance / (THRESHOLD * 0.5), 1);
  const circumference = Math.PI * (RING_SIZE - RING_STROKE);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator area */}
      <motion.div
        animate={{
          height: pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 48 : 0) : 0,
          opacity: pullDistance > 4 || refreshing ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div
          animate={{
            scale: passedThreshold || refreshing ? 1 : 0.7 + progress * 0.3,
            rotate: refreshing ? 360 : 0,
          }}
          transition={
            refreshing
              ? { rotate: { duration: 0.8, repeat: Infinity, ease: "linear" } }
              : { duration: 0.2 }
          }
        >
          {/* SVG Progress Ring */}
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="block"
          >
            {/* Background track */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={(RING_SIZE - RING_STROKE) / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              className="text-neutral-200 dark:text-neutral-700"
            />
            {/* Progress arc */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={(RING_SIZE - RING_STROKE) / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={refreshing ? 0.25 * circumference : strokeDashoffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              className={
                passedThreshold || refreshing
                  ? "text-secondary-500 transition-colors duration-150"
                  : "text-neutral-400 dark:text-neutral-500 transition-colors duration-150"
              }
            />
          </svg>
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
}
