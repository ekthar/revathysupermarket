"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(endDate: Date): CountdownResult {
  const now = Date.now();
  const diff = endDate.getTime() - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, isExpired: false };
}

/**
 * Countdown hook that ticks toward an end date.
 *
 * - Updates every second (simple, reliable, negligible cost for max ~6 cards).
 * - Cleans up interval on unmount.
 * - Returns expired state gracefully when the date is in the past.
 */
export function useCountdown(endDate: Date | string): CountdownResult {
  const target = useRef<Date>(
    endDate instanceof Date ? endDate : new Date(endDate)
  );

  // Update target ref if endDate prop changes
  useEffect(() => {
    target.current = endDate instanceof Date ? endDate : new Date(endDate);
  }, [endDate]);

  const getTimeLeft = useCallback(() => calculateTimeLeft(target.current), []);

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(getTimeLeft);

  useEffect(() => {
    // Calculate initial state
    const initial = getTimeLeft();
    setTimeLeft(initial);

    if (initial.isExpired) return;

    const id = setInterval(() => {
      const updated = getTimeLeft();
      setTimeLeft(updated);

      if (updated.isExpired) {
        clearInterval(id);
      }
    }, 1_000);

    return () => clearInterval(id);
  }, [getTimeLeft]);

  return timeLeft;
}
