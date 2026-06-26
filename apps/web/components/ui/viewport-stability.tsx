"use client";

import { useEffect } from "react";

const KEYBOARD_THRESHOLD = 140;

export function ViewportStability() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;

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
        root.toggleAttribute("data-keyboard-open", focused && keyboardInset > KEYBOARD_THRESHOLD);
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
