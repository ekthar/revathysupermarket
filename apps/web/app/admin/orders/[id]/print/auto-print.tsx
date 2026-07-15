"use client";

import { useEffect } from "react";

/**
 * Client component that auto-triggers the browser print dialog on mount.
 * Used in the print view page so printing starts immediately when the tab opens.
 */
export function AutoPrint() {
  useEffect(() => {
    window.print();
  }, []);

  return null;
}
