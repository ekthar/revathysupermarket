"use client";

import { useRef, useState, useEffect } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { springs } from "@/lib/motion";

interface SlideToConfirmProps {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

/**
 * Slide-to-confirm using pointer events (not framer-motion drag which has
 * issues with dynamic constraints). Reliable on mobile and desktop.
 */
export function SlideToConfirm({ label = "Slide to confirm", onConfirm, disabled = false }: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [trackWidth, setTrackWidth] = useState(300);
  const thumbSize = 56;
  const maxX = trackWidth - thumbSize - 8; // 8px for padding

  // Measure track on mount and resize
  useEffect(() => {
    function measure() {
      if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled || confirmed) return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - thumbSize / 2;
    setOffsetX(Math.max(0, Math.min(x, maxX)));
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (offsetX >= maxX * 0.85) {
      setOffsetX(maxX);
      setConfirmed(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
      setTimeout(onConfirm, 200);
    } else {
      setOffsetX(0);
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }

  const progress = maxX > 0 ? offsetX / maxX : 0;

  if (confirmed) {
    return (
      <div className="flex h-16 items-center justify-center rounded-2xl bg-emerald-500">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springs.snappy}>
          <CheckCircle2 className="h-7 w-7 text-white" />
        </motion.div>
        <span className="ml-2 font-black text-white">Confirmed!</span>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={`relative flex h-16 items-center overflow-hidden rounded-2xl select-none ${disabled ? "bg-slate-200 dark:bg-slate-800" : "bg-slate-900 dark:bg-slate-100"}`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 rounded-2xl bg-emerald-500 transition-opacity"
        style={{ opacity: 0.1 + progress * 0.5 }}
      />

      {/* Label */}
      <span
        className={`absolute inset-0 flex items-center justify-center text-sm font-black transition-opacity ${disabled ? "text-slate-400" : "text-white/70 dark:text-slate-900/70"}`}
        style={{ opacity: Math.max(0, 1 - progress * 3) }}
      >
        {label} &rarr;
      </span>

      {/* End check icon */}
      <div
        className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 transition-transform"
        style={{ transform: `scale(${Math.max(0, (progress - 0.7) * 3.3)})` }}
      >
        <CheckCircle2 className="h-5 w-5 text-white" />
      </div>

      {/* Draggable Thumb */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 ml-1 flex h-14 w-14 items-center justify-center rounded-xl shadow-lg cursor-grab active:cursor-grabbing ${
          disabled ? "bg-slate-300 dark:bg-slate-600" : "bg-emerald-500"
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          touchAction: "none",
        }}
      >
        <ChevronRight className={`h-6 w-6 ${disabled ? "text-slate-500" : "text-white"}`} />
        <ChevronRight className={`-ml-4 h-6 w-6 ${disabled ? "text-slate-500" : "text-white/50"}`} />
      </div>
    </div>
  );
}
