"use client";

import { useEffect } from "react";

const KEYBOARD_THRESHOLD = 140;
const KEYBOARD_RECOVERY_MS = 5000; // Force remove keyboard state after 5s of no focus

/**
 * ViewportStability — tracks visual viewport for keyboard-aware layouts.
 *
 * Safety: if keyboard state gets stuck (Android quirks), a recovery timeout
 * clears it after 5 seconds. CSS transitions handle the show/hide smoothly.
 */
export function ViewportStability() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;

    function clearRecovery() {
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const visibleHeight = viewport?.height ?? window.innerHeight;
        const keyboardInset = Math.max(0, window.innerHeight - visibleHeight - (viewport?.offsetTop ?? 0));
        const focused = document.activeElement instanceof HTMLInputElement
          || document.activeElement instanceof HTMLTextAreaElement
          || document.activeElement instanceof HTMLSelectElement
          || (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable);

        root.style.setProperty("--visual-viewport-height", `${Math.round(visibleHeight)}px`);
        root.style.setProperty("--keyboard-inset", `${Math.round(keyboardInset)}px`);

        const keyboardOpen = focused && keyboardInset > KEYBOARD_THRESHOLD;
        root.toggleAttribute("data-keyboard-open", keyboardOpen);

        // Recovery: if keyboard was open but focus is lost, start countdown
        clearRecovery();
        if (!focused && root.hasAttribute("data-keyboard-open")) {
          recoveryTimer = setTimeout(() => {
            root.removeAttribute("data-keyboard-open");
            root.style.setProperty("--keyboard-inset", "0px");
          }, KEYBOARD_RECOVERY_MS);
        }
      });
    }

    sync();
    viewport?.addEventListener("resize", sync, { passive: true });
    viewport?.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    document.addEventListener("focusin", sync, { passive: true });
    document.addEventListener("focusout", sync, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearRecovery();
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
