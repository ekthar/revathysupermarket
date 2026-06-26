"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Download, Share, Plus, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISSED_KEY = "app-install-dismissed-at";
const VISITS_KEY = "app-install-visits";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPad on iOS 13+
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|crios|fxios|edgios|opera/i.test(ua);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallAppPrompt() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_INSTALL_PROMPT === "false") return;
    if (isStandalone()) return;

    const visits = Number(localStorage.getItem(VISITS_KEY) || "0") + 1;
    localStorage.setItem(VISITS_KEY, String(visits));

    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || "0");
    // On iOS/Safari: re-show after 3 days (they need more nudges since no native prompt)
    // On others: re-show after 14 days
    const cooldown = isIosDevice() ? 3 * 24 * 60 * 60 * 1000 : 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedAt < cooldown) return;

    // Show on first visit for iOS (no beforeinstallprompt), 2nd visit for others
    const minVisits = isIosDevice() ? 1 : 2;
    if (visits < minVisits) return;

    const isIos = isIosDevice();
    setIos(isIos);

    const reveal = () => {
      if (!document.querySelector("[data-push-prompt], [role='dialog']")) setVisible(true);
    };

    // For iOS/Safari: show after 4 seconds (no beforeinstallprompt event fires)
    if (isIos || isSafari()) {
      const timer = window.setTimeout(reveal, 4000);
      const openFromMenu = () => setVisible(true);
      window.addEventListener("msm:install-app", openFromMenu);
      return () => { window.clearTimeout(timer); window.removeEventListener("msm:install-app", openFromMenu); };
    }

    // For Chrome/Edge/etc: wait for beforeinstallprompt
    const timer = window.setTimeout(() => { if (isIos) reveal(); }, 7000);
    const capture = (value: Event) => {
      value.preventDefault();
      setEvent(value as InstallEvent);
      window.setTimeout(reveal, 5000);
    };
    window.addEventListener("beforeinstallprompt", capture);
    const openFromMenu = () => setVisible(true);
    window.addEventListener("msm:install-app", openFromMenu);
    window.addEventListener("appinstalled", () => setVisible(false), { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("msm:install-app", openFromMenu);
    };
  }, []);

  if (!visible || ["/login", "/welcome", "/checkout"].some((route) => pathname.startsWith(route))) return null;

  const role = session?.user?.role;
  const copy = role === "DELIVERY_PARTNER"
    ? "Install the delivery workspace for faster access to assigned orders."
    : role && role !== "CUSTOMER"
      ? "Install store operations for quicker order and inventory access."
      : "Install the shop for faster ordering and live delivery updates.";

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
  }

  return (
    <aside
      data-hide-on-keyboard="true"
      className="fixed left-[max(0.75rem,var(--safe-left))] right-[max(0.75rem,var(--safe-right))] bottom-[calc(var(--mobile-nav-height)+var(--safe-bottom)+0.5rem)] z-[80] mx-auto max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl transition-[opacity,transform] dark:bg-slate-900 md:bottom-6 md:left-auto md:right-6 md:mx-0"
      aria-label="Install application"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-9">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
          {ios ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </span>
        <div>
          <p className="font-display text-base font-black">Install this app</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{copy}</p>
        </div>
      </div>

      {ios ? (
        <div className="mt-4 space-y-2.5">
          {/* Step-by-step Safari instructions with visual indicators */}
          <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Add to Home Screen:</p>
            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">1</span>
                <span>Tap the <Share className="inline h-4 w-4 text-blue-500 -mt-0.5" /> Share button in Safari</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">2</span>
                <span>Scroll down and tap <Plus className="inline h-4 w-4 -mt-0.5" /> <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">3</span>
                <span>Tap <strong>Add</strong> in the top right</span>
              </li>
            </ol>
          </div>
          <p className="text-center text-xs text-slate-400">Works best in Safari browser</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={install}
          className="mt-3 h-11 w-full rounded-2xl bg-black text-sm font-black text-white transition-transform active:scale-[0.98]"
        >
          Install app
        </button>
      )}
    </aside>
  );
}
