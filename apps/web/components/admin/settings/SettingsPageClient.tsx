"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Store, Truck, CreditCard, Flag, Clock, Phone } from "lucide-react";
import { AdminPageShell } from "@/components/admin/shared";

// --- Types ---

interface FeatureFlagRow {
  id: string;
  key: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  updatedAt: string;
}

interface SettingsPageClientProps {
  settings: Record<string, string>;
  featureFlags: FeatureFlagRow[];
}

// --- Tab Config ---

type TabKey = "store" | "delivery" | "payments" | "flags";

const TABS: { key: TabKey; label: string; icon: typeof Store }[] = [
  { key: "store", label: "Store", icon: Store },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "flags", label: "Feature Flags", icon: Flag },
];

// --- Helpers ---

function SettingRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Store }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-3.5 last:border-0 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4 text-neutral-400" />}
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      </div>
      <span className="text-sm text-neutral-900 dark:text-neutral-100">{value || "—"}</span>
    </div>
  );
}

function FlagDescription(key: string): string {
  const descriptions: Record<string, string> = {
    loyalty_program: "Enable loyalty points earning and redemption",
    scheduled_delivery: "Allow customers to schedule delivery time slots",
    wallet_payments: "Enable wallet top-up and wallet payment method",
    push_notifications: "Send push notifications for order updates",
    whatsapp_updates: "Send WhatsApp messages for order status changes",
    upi_payments: "Accept UPI payments on delivery",
    promo_codes: "Enable promo code entry at checkout",
    returns_enabled: "Allow customers to request returns/refunds",
    new_ui: "Enable the redesigned customer-facing UI",
  };
  return descriptions[key] || `Toggle ${key.replace(/_/g, " ")}`;
}

// --- Component ---

export function SettingsPageClient({
  settings,
  featureFlags,
}: SettingsPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("store");
  const [flagStates, setFlagStates] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const flag of featureFlags) {
        initial[flag.key] = flag.enabled;
      }
      return initial;
    }
  );

  const handleToggleFlag = useCallback(
    async (key: string) => {
      const newState = !flagStates[key];
      setFlagStates((prev) => ({ ...prev, [key]: newState }));

      try {
        await fetch("/api/admin/settings/flags", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        router.refresh();
      } catch {
        // Revert on failure
        setFlagStates((prev) => ({ ...prev, [key]: !newState }));
      }
    },
    [flagStates, router]
  );

  const handleSaveSettings = useCallback(
    async (updates: Record<string, string>) => {
      try {
        await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        router.refresh();
      } catch {
        // Silently fail
      }
    },
    [router]
  );

  return (
    <AdminPageShell
      eyebrow="Administration"
      title="Settings"
      description="Manage store configuration and feature flags"
      breadcrumbs={[{ label: "Settings" }]}
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab.key === activeTab
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
        {/* Store Tab */}
        {activeTab === "store" && (
          <div className="space-y-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Store Information
            </h3>
            <SettingRow icon={Store} label="Store Name" value={settings.store_name || "MSM Supermarket"} />
            <SettingRow icon={Phone} label="Phone" value={settings.store_phone || "—"} />
            <SettingRow icon={Store} label="Address" value={settings.store_address || "—"} />
            <SettingRow icon={Truck} label="Delivery Radius"
              value={settings.delivery_radius ? `${settings.delivery_radius} km` : "5 km"} />
            <SettingRow icon={Clock} label="Operating Hours" value={settings.operating_hours || "8:00 AM – 10:00 PM"} />
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && (
          <div className="space-y-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Delivery Configuration
            </h3>
            <SettingRow icon={Truck} label="Free Delivery Threshold"
              value={settings.free_delivery_threshold ? `₹${Number(settings.free_delivery_threshold).toLocaleString("en-IN")}` : "₹500"} />
            <SettingRow icon={CreditCard} label="Base Delivery Fee"
              value={settings.base_delivery_fee ? `₹${Number(settings.base_delivery_fee).toLocaleString("en-IN")}` : "₹30"} />
            <SettingRow icon={Clock} label="Estimated Delivery Time"
              value={settings.delivery_time || "30–45 minutes"} />
            <SettingRow icon={Truck} label="Max Delivery Distance"
              value={settings.max_delivery_distance ? `${settings.max_delivery_distance} km` : "5 km"} />
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Payment Methods
            </h3>
            {[
              { key: "payment_cod", label: "Cash on Delivery", defaultEnabled: true },
              { key: "payment_upi", label: "UPI on Delivery", defaultEnabled: true },
              { key: "payment_wallet", label: "Wallet", defaultEnabled: false },
              { key: "payment_card", label: "Card Payment", defaultEnabled: false },
            ].map((method) => {
              const isEnabled = settings[method.key]
                ? settings[method.key] === "true"
                : method.defaultEnabled;
              return (
                <div
                  key={method.key}
                  className="flex items-center justify-between border-b border-neutral-100 py-3.5 last:border-0 dark:border-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {method.label}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSettings({
                        [method.key]: isEnabled ? "false" : "true",
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isEnabled
                        ? "bg-green-500"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                    aria-label={`Toggle ${method.label}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === "flags" && (
          <div className="space-y-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Feature Flags
            </h3>
            {featureFlags.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                No feature flags configured.
              </p>
            ) : (
              featureFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between border-b border-neutral-100 py-3.5 last:border-0 dark:border-neutral-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {flag.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {FlagDescription(flag.key)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFlag(flag.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      flagStates[flag.key]
                        ? "bg-green-500"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                    aria-label={`Toggle ${flag.key}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        flagStates[flag.key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
