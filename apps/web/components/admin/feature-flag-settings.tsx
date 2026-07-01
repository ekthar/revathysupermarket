"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Printer, Eye } from "lucide-react";

interface FlagData {
  key: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

interface DeliveryPartner {
  id: string;
  name: string;
}

interface Props {
  flags: FlagData[];
  deliveryPartners: DeliveryPartner[];
}

const FLAG_META: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  stock_value_visible: {
    label: "Stock Value Visible",
    description: "Show inventory valuation on the admin dashboard",
    icon: Eye,
  },
  forced_accept_delivery: {
    label: "Forced Accept Delivery",
    description: "Auto-assign orders to delivery staff without accept/reject choice",
    icon: Shield,
  },
  ring_alert_rules: {
    label: "Ring Alert Rules",
    description: "Configure ringtone, duration, and escalation for incoming order alerts",
    icon: Bell,
  },
  print_required_alert: {
    label: "Print Required Alert",
    description: "Alert when orders remain unprinted past a time threshold",
    icon: Printer,
  },
};

export function FeatureFlagSettings({ flags, deliveryPartners }: Props) {
  const [flagState, setFlagState] = useState<FlagData[]>(flags);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function updateFlag(key: string, updates: { enabled?: boolean; config?: Record<string, unknown> | null }) {
    setSaving(key);
    try {
      const response = await fetch("/api/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to update flag", "error");
        return;
      }
      setFlagState((prev) =>
        prev.map((f) => (f.key === key ? { ...f, ...updates, enabled: updates.enabled ?? f.enabled, config: updates.config !== undefined ? updates.config : f.config } : f))
      );
      showToast(`${FLAG_META[key]?.label ?? key} updated`, "success");
    } catch {
      showToast("Network error", "error");
    } finally {
      setSaving(null);
    }
  }

  function getFlag(key: string): FlagData | undefined {
    return flagState.find((f) => f.key === key);
  }

  // forced_accept_delivery helpers
  const forcedAcceptFlag = getFlag("forced_accept_delivery");
  const forcedAcceptOverrides: Array<{ userId: string; enabled: boolean }> =
    (forcedAcceptFlag?.config as { overrides?: Array<{ userId: string; enabled: boolean }> } | null)?.overrides ?? [];

  function isStaffForced(userId: string): boolean {
    const override = forcedAcceptOverrides.find((o) => o.userId === userId);
    if (override) return override.enabled;
    return forcedAcceptFlag?.enabled ?? false;
  }

  async function toggleStaffOverride(userId: string, enabled: boolean) {
    const newOverrides = forcedAcceptOverrides.filter((o) => o.userId !== userId);
    // Only add override if it differs from global
    if (enabled !== (forcedAcceptFlag?.enabled ?? false)) {
      newOverrides.push({ userId, enabled });
    }
    await updateFlag("forced_accept_delivery", {
      config: { overrides: newOverrides },
    });
  }

  // ring_alert_rules helpers
  const ringFlag = getFlag("ring_alert_rules");
  const ringConfig = ringFlag?.config as {
    ringtone?: string;
    durationSeconds?: number;
    escalationAfterSeconds?: number;
    escalationTarget?: string;
  } | null;

  // print_required_alert helpers
  const printFlag = getFlag("print_required_alert");
  const printConfig = printFlag?.config as { thresholdMinutes?: number } | null;

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-bold shadow-lg ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.message}
        </div>
      )}

      {/* Stock Value Visible */}
      <FlagCard
        flag={getFlag("stock_value_visible")}
        saving={saving === "stock_value_visible"}
        onToggle={(enabled) => updateFlag("stock_value_visible", { enabled })}
      />

      {/* Forced Accept Delivery */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Forced Accept Delivery</h3>
              <p className="text-xs text-slate-500 mt-0.5">Global toggle + per-staff overrides</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={forcedAcceptFlag?.enabled ?? false}
              onChange={(e) => updateFlag("forced_accept_delivery", { enabled: e.target.checked })}
              disabled={saving === "forced_accept_delivery"}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
          </label>
        </div>

        {/* Per-staff overrides */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Per-Staff Override</p>
          <p className="text-xs text-slate-400 mb-3">
            {forcedAcceptFlag?.enabled
              ? "Global is ON — staff below with toggle OFF are exempt (can accept/reject)"
              : "Global is OFF — staff below with toggle ON are forced-accept regardless"}
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {deliveryPartners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{partner.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStaffForced(partner.id)}
                    onChange={(e) => toggleStaffOverride(partner.id, e.target.checked)}
                    disabled={saving === "forced_accept_delivery"}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>
            ))}
            {deliveryPartners.length === 0 && (
              <p className="text-xs text-slate-400 italic">No delivery partners found</p>
            )}
          </div>
        </div>
      </div>

      {/* Ring Alert Rules */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Ring Alert Rules</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ringtone, duration, and escalation for incoming orders</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={ringFlag?.enabled ?? false}
              onChange={(e) => updateFlag("ring_alert_rules", { enabled: e.target.checked })}
              disabled={saving === "ring_alert_rules"}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
          </label>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Ringtone</span>
            <input
              type="text"
              defaultValue={ringConfig?.ringtone ?? "default"}
              onBlur={(e) => {
                const val = e.target.value.trim() || "default";
                updateFlag("ring_alert_rules", {
                  config: { ...ringConfig, ringtone: val },
                });
              }}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Duration (seconds)</span>
            <input
              type="number"
              min={5}
              max={120}
              defaultValue={ringConfig?.durationSeconds ?? 30}
              onBlur={(e) => {
                const val = Math.max(5, Math.min(120, Number(e.target.value) || 30));
                updateFlag("ring_alert_rules", {
                  config: { ...ringConfig, durationSeconds: val },
                });
              }}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Escalation After (seconds)</span>
            <input
              type="number"
              min={10}
              max={300}
              defaultValue={ringConfig?.escalationAfterSeconds ?? 60}
              onBlur={(e) => {
                const val = Math.max(10, Math.min(300, Number(e.target.value) || 60));
                updateFlag("ring_alert_rules", {
                  config: { ...ringConfig, escalationAfterSeconds: val },
                });
              }}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Escalation Target</span>
            <select
              defaultValue={ringConfig?.escalationTarget ?? "admin"}
              onChange={(e) => {
                updateFlag("ring_alert_rules", {
                  config: { ...ringConfig, escalationTarget: e.target.value },
                });
              }}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="all_staff">All Staff</option>
            </select>
          </label>
        </div>
      </div>

      {/* Print Required Alert */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <Printer className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Print Required Alert</h3>
              <p className="text-xs text-slate-500 mt-0.5">Alert when orders are unprinted past a time threshold</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={printFlag?.enabled ?? false}
              onChange={(e) => updateFlag("print_required_alert", { enabled: e.target.checked })}
              disabled={saving === "print_required_alert"}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
          </label>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
          <label className="block max-w-xs">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Threshold (minutes)</span>
            <input
              type="number"
              min={1}
              max={120}
              defaultValue={printConfig?.thresholdMinutes ?? 10}
              onBlur={(e) => {
                const val = Math.max(1, Math.min(120, Number(e.target.value) || 10));
                updateFlag("print_required_alert", {
                  config: { thresholdMinutes: val },
                });
              }}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">Orders unprinted longer than this will trigger a dashboard alert</p>
          </label>
        </div>
      </div>
    </div>
  );
}

/** Simple toggle card for flags that only need enabled/disabled */
function FlagCard({
  flag,
  saving,
  onToggle,
}: {
  flag: FlagData | undefined;
  saving: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  if (!flag) return null;
  const meta = FLAG_META[flag.key] ?? { label: flag.key, description: "", icon: Settings };
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{meta.label}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={flag.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={saving}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
      </label>
    </div>
  );
}
