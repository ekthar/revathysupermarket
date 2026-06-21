"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [installed, setInstalled] = useState(true);
  useEffect(() => setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)), []);
  if (installed) return null;
  return <button type="button" onClick={() => window.dispatchEvent(new Event("msm:install-app"))} className={compact ? "flex h-8 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-black text-primary" : "flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 text-sm font-black text-primary"}><Download className="h-4 w-4" />Install App</button>;
}
