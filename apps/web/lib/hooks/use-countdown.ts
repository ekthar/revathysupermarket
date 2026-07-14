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
 * - Updates every second when less than 1 hour remains.
 * - Updates every minute when more than 1 hour remains.
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

    // Determine tick interval: 1s if under 1 hour, 60s otherwise
    const intervalMs = initial.hours >= 1 ? 60_000 : 1_000;

    const id = setInterval(() => {
      const updated = getTimeLeft();
      setTimeLeft(updated);

      if (updated.isExpired) {
        clearInterval(id);
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [getTimeLeft]);

  return timeLeft;
}
