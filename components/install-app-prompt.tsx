"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Download, Share, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISSED_KEY = "app-install-dismissed-at";
const VISITS_KEY = "app-install-visits";

export function InstallAppPrompt() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_INSTALL_PROMPT === "false") return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) return;
    const visits = Number(localStorage.getItem(VISITS_KEY) || "0") + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || "0");
    if (visits < 2 || Date.now() - dismissedAt < 14 * 24 * 60 * 60 * 1000) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    const reveal = () => { if (!document.querySelector("[data-push-prompt], [role='dialog']")) setVisible(true); };
    const timer = window.setTimeout(() => { if (isIos) reveal(); }, 7000);
    const capture = (value: Event) => { value.preventDefault(); setEvent(value as InstallEvent); window.setTimeout(reveal, 7000); };
    window.addEventListener("beforeinstallprompt", capture);
    const openFromMenu = () => setVisible(true);
    window.addEventListener("msm:install-app", openFromMenu);
    window.addEventListener("appinstalled", () => setVisible(false), { once: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("msm:install-app", openFromMenu); };
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
    <aside className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-w-md rounded-3xl border border-primary/20 bg-white p-4 shadow-2xl dark:bg-slate-900 md:bottom-6 md:left-auto md:right-6 md:mx-0" aria-label="Install application">
      <button type="button" onClick={dismiss} aria-label="Dismiss install suggestion" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"><X className="h-4 w-4" /></button>
      <div className="flex gap-3 pr-9">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{ios ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}</span>
        <div><p className="font-display text-base font-black">Install this app</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{copy}</p></div>
      </div>
      {ios ? <p className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800">Tap Share, then “Add to Home Screen”.</p> : <button type="button" onClick={install} className="mt-3 h-11 w-full rounded-2xl bg-primary text-sm font-black text-white">Install app</button>}
    </aside>
  );
}
