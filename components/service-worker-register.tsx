"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let updateInterval = 0;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (reg.waiting) setWaitingWorker(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(worker);
              }
            });
          });
          updateInterval = window.setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch(() => undefined);
    };

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
    return () => {
      if (updateInterval) window.clearInterval(updateInterval);
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waitingWorker) return null;
  return (
    <button
      type="button"
      onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}
      className="fixed bottom-[calc(var(--mobile-nav-height)+var(--safe-bottom)+0.75rem)] left-1/2 z-[89] -translate-x-1/2 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white shadow-xl md:bottom-6"
    >
      Update available · Reload
    </button>
  );
}
