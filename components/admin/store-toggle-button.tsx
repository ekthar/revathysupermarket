"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function StoreToggleButton({ initialIsOpen }: { initialIsOpen: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const newState = !isOpen;
    setLoading(true);
    const res = await fetch("/api/admin/store-toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: newState })
    });
    setLoading(false);
    if (res.ok) {
      setIsOpen(newState);
      router.refresh();
    } else {
      showToast("Store status could not be updated", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={isOpen ? "Close store for new orders" : "Open store for new orders"}
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro font-bold transition-all press ${
        isOpen
          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
      {loading ? "..." : isOpen ? "Store Open" : "Store Closed"}
    </button>
  );
}
