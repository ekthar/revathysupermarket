"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 80;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isTracking = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    isTracking.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTracking.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) {
      setPullDistance(0);
      return;
    }
    const eased = Math.min(dy * 0.4, 120);
    setPullDistance(eased);
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    isTracking.current = false;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative">
      <motion.div
        animate={{ height: pullDistance, opacity: pullDistance > 0 ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div
          animate={{ rotate: refreshing ? 360 : Math.min(pullDistance / THRESHOLD, 1) * 180 }}
          transition={{ duration: refreshing ? 0.6 : 0.2, repeat: refreshing ? Infinity : 0, ease: "linear" }}
          className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
        />
      </motion.div>
      {children}
    </div>
  );
}
