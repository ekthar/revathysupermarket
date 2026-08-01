"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type AnnounceContextValue = {
  announce: (message: string) => void;
};

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

/**
 * Screen-reader announcement provider.
 *
 * Renders a visually hidden aria-live region that screen readers will announce
 * when the text content changes. Uses a key-based reset technique to ensure
 * repeated identical messages are re-announced.
 */
export function SRAnnounceProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [key, setKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback((msg: string) => {
    // Clear any pending reset so rapid-fire announcements don't fight
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Increment key to force React to remount the live region, ensuring
    // screen readers pick up even identical repeated messages.
    setKey((k) => k + 1);
    setMessage(msg);

    // Clear the message after a delay so it does not accumulate in the
    // virtual buffer for users navigating back through the page.
    timeoutRef.current = setTimeout(() => {
      setMessage("");
    }, 5000);
  }, []);

  return (
    <AnnounceContext.Provider value={{ announce }}>
      {children}
      {/* Visually hidden live region for screen reader announcements */}
      <div
        key={key}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    </AnnounceContext.Provider>
  );
}

/**
 * Hook to announce messages to screen readers.
 *
 * Must be used inside a SRAnnounceProvider.
 *
 * Usage:
 *   const announce = useAnnounce();
 *   announce("Added Milk to cart");
 */
export function useAnnounce(): (message: string) => void {
  const ctx = useContext(AnnounceContext);
  if (!ctx) throw new Error("useAnnounce must be used inside SRAnnounceProvider");
  return ctx.announce;
}
