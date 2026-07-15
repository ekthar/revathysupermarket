"use client";

import { useEffect, useState } from "react";
import { Bell, MessageCircle, Megaphone, Moon, Package, Sun, TrendingDown, Gift, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";

interface SettingsProps {
  settings: {
    pushNotifications: boolean;
    orderUpdates: boolean;
    promotionalMessages: boolean;
    whatsappNotifications: boolean;
    priceDropAlerts: boolean;
    weeklyDeals: boolean;
    deliveryAlerts: boolean;
  };
}

export function SettingsClient({ settings: initial }: SettingsProps) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Sync dark mode state on mount
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  async function toggleSetting(key: keyof typeof settings) {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    setSaving(true);
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue })
      });
      if (!res.ok) {
        setSettings((prev) => ({ ...prev, [key]: !newValue }));
        setMessage("Failed to save. Try again.");
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Theme */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-3">Appearance</p>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex w-full items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-700 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {darkMode ? "Dark Mode" : "Light Mode"}
            </span>
          </div>
          <div className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? "bg-indigo-500" : "bg-neutral-300"}`}>
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>
      {/* Notifications Section */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-caption font-semibold text-neutral-400 uppercase tracking-wide">Notifications</p>

        <SettingToggle
          icon={Bell}
          label="Push Notifications"
          description="Order updates, delivery alerts"
          enabled={settings.pushNotifications}
          onToggle={() => toggleSetting("pushNotifications")}
        />
        <SettingToggle
          icon={Package}
          label="Order Status Updates"
          description="Get notified on every status change"
          enabled={settings.orderUpdates}
          onToggle={() => toggleSetting("orderUpdates")}
        />
        <SettingToggle
          icon={MessageCircle}
          label="WhatsApp Notifications"
          description="Receive updates via WhatsApp"
          enabled={settings.whatsappNotifications}
          onToggle={() => toggleSetting("whatsappNotifications")}
        />
        <SettingToggle
          icon={Megaphone}
          label="Promotional Messages"
          description="Deals, offers & new arrivals"
          enabled={settings.promotionalMessages}
          onToggle={() => toggleSetting("promotionalMessages")}
        />
        <SettingToggle
          icon={TrendingDown}
          label="Price Drop Alerts"
          description="Get notified when prices drop on your favorites"
          enabled={settings.priceDropAlerts}
          onToggle={() => toggleSetting("priceDropAlerts")}
        />
        <SettingToggle
          icon={Gift}
          label="Weekly Deals"
          description="Weekly curated deals and offers"
          enabled={settings.weeklyDeals}
          onToggle={() => toggleSetting("weeklyDeals")}
        />
        <SettingToggle
          icon={Truck}
          label="Delivery Status Alerts"
          description="Real-time delivery tracking updates"
          enabled={settings.deliveryAlerts}
          onToggle={() => toggleSetting("deliveryAlerts")}
        />
      </div>

      {/* About Section */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-caption font-semibold text-neutral-400 uppercase tracking-wide">About</p>
        <div className="px-4 py-3 border-t border-neutral-50 dark:border-neutral-800">
          <div className="flex justify-between items-center">
            <span className="text-body text-neutral-600 dark:text-neutral-300">App Version</span>
            <span className="text-caption font-semibold text-neutral-400">1.0.0</span>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-neutral-50 dark:border-neutral-800">
          <div className="flex justify-between items-center">
            <span className="text-body text-neutral-600 dark:text-neutral-300">Terms & Conditions</span>
            <span className="text-caption text-primary font-semibold">View</span>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-neutral-50 dark:border-neutral-800">
          <div className="flex justify-between items-center">
            <span className="text-body text-neutral-600 dark:text-neutral-300">Privacy Policy</span>
            <span className="text-caption text-primary font-semibold">View</span>
          </div>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-caption font-medium text-red-500"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-t border-neutral-50 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
        </div>
        <div>
          <p className="text-body font-medium text-neutral-800 dark:text-white">{label}</p>
          <p className="text-caption text-neutral-400 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${
          enabled ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700"
        }`}
        aria-label={`Toggle ${label}`}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="stay-light absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}


