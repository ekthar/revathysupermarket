"use client";

import { useState } from "react";
import { Bell, MessageCircle, Megaphone, Package, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";

interface SettingsProps {
  settings: {
    pushNotifications: boolean;
    orderUpdates: boolean;
    promotionalMessages: boolean;
    whatsappNotifications: boolean;
  };
}

export function SettingsClient({ settings: initial }: SettingsProps) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

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
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Notifications</p>

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
      </div>

      {/* Appearance Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Appearance</p>

        <div className="px-4 py-4">
          <p className="text-[13px] font-medium text-slate-800 dark:text-white mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            <ThemeOption
              icon={Sun}
              label="Light"
              active={theme === "light"}
              onClick={() => setTheme("light")}
            />
            <ThemeOption
              icon={Moon}
              label="Dark"
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
            />
            <ThemeOption
              icon={Monitor}
              label="System"
              active={theme === "system"}
              onClick={() => setTheme("system")}
            />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">About</p>
        <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-600 dark:text-slate-300">App Version</span>
            <span className="text-[12px] font-semibold text-slate-400">1.0.0</span>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-600 dark:text-slate-300">Terms & Conditions</span>
            <span className="text-[12px] text-primary font-semibold">View</span>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-600 dark:text-slate-300">Privacy Policy</span>
            <span className="text-[12px] text-primary font-semibold">View</span>
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
            className="text-center text-[12px] font-medium text-red-500"
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
    <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-50 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-slate-800 dark:text-white">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${
          enabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
        }`}
        aria-label={`Toggle ${label}`}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm"
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
          : "bg-slate-50 dark:bg-slate-800 border-2 border-transparent"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-slate-400"}`} />
      <span className={`text-[11px] font-semibold ${active ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}>
        {label}
      </span>
    </button>
  );
}
