"use client";

import { useState } from "react";
import { Bell, MessageCircle, Megaphone, Package, Moon, Sun, TrendingDown, Gift, Truck } from "lucide-react";
import { useTheme } from "next-themes";
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
  const { resolvedTheme, setTheme } = useTheme();

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

      {/* Appearance Section */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-caption font-semibold text-neutral-400 uppercase tracking-wide">Appearance</p>

        <div className="px-4 py-4">
          <p className="text-body font-medium text-neutral-800 dark:text-white mb-3">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            <ThemeOption
              icon={Sun}
              label="Light"
              active={resolvedTheme === "light"}
              onClick={() => setTheme("light")}
            />
            <ThemeOption
              icon={Moon}
              label="Dark"
              active={resolvedTheme === "dark"}
              onClick={() => setTheme("dark")}
            />
          </div>
        </div>
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

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all press ${
        active
          ? "bg-primary/10 dark:bg-primary/20 border-2 border-primary"
          : "bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-neutral-400"}`} />
      <span className={`text-caption font-semibold ${active ? "text-primary" : "text-neutral-500 dark:text-neutral-400"}`}>
        {label}
      </span>
    </button>
  );
}
