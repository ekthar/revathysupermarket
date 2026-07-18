"use client";

import { useCallback, useRef } from "react";

/**
 * Velocity Tracker Hook — tracks pointer velocity for gesture handoff.
 *
 * Maintains a rolling history of pointer positions + timestamps (last 8 events).
 * Computes velocity using events ~16-32ms ago (not the very last event,
 * which is often a near-zero-distance touch-up artifact on mobile).
 *
 * Apple's "Designing Fluid Interfaces" (WWDC 2018):
 * "Use the averaged historical velocity, not the instantaneous last-frame delta."
 */

interface VelocityPoint {
  x: number;
  y: number;
  t: number; // timestamp (performance.now())
}

export interface Velocity {
  x: number; // px/s
  y: number; // px/s
}

const HISTORY_SIZE = 8;
const MIN_SAMPLE_AGE_MS = 16; // Don't use the very last event
const MAX_SAMPLE_AGE_MS = 100; // Don't use events older than 100ms

export function useVelocityTracker() {
  const historyRef = useRef<VelocityPoint[]>([]);

  /**
   * Record a pointer position. Call on every pointermove.
   */
  const track = useCallback((x: number, y: number) => {
    const history = historyRef.current;
    history.push({ x, y, t: performance.now() });
    // Keep only the last N entries
    if (history.length > HISTORY_SIZE) {
      history.shift();
    }
  }, []);

  /**
   * Compute current velocity in px/s.
   * Uses the best available sample from 16-100ms ago.
   */
  const getVelocity = useCallback((): Velocity => {
    const history = historyRef.current;
    if (history.length < 2) return { x: 0, y: 0 };

    const now = performance.now();
    const latest = history[history.length - 1];

    // Find the best reference point: ideally 16-32ms ago
    let bestRef: VelocityPoint | null = null;
    for (let i = history.length - 2; i >= 0; i--) {
      const age = now - history[i].t;
      if (age >= MIN_SAMPLE_AGE_MS && age <= MAX_SAMPLE_AGE_MS) {
        bestRef = history[i];
        break;
      }
    }

    // Fallback: use the oldest point if nothing in the ideal range
    if (!bestRef) {
      bestRef = history[0];
    }

    const dt = (latest.t - bestRef.t) / 1000; // seconds
    if (dt === 0) return { x: 0, y: 0 };

    return {
      x: (latest.x - bestRef.x) / dt,
      y: (latest.y - bestRef.y) / dt,
    };
  }, []);

  /**
   * Reset the history. Call on pointer-down to start fresh.
   */
  const reset = useCallback(() => {
    historyRef.current = [];
  }, []);

  return { track, getVelocity, reset };
}
