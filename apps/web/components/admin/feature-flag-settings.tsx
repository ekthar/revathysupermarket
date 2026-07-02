"use client";

import { useState } from "react";
import {
  Settings, Shield, Bell, Printer, Eye, Truck, Zap, DollarSign,
  Package, Clock, TrendingUp, Heart, Wallet, Star, Users, Globe,
  ShoppingCart, Store, AlertTriangle, CreditCard, Smartphone, Gift,
  MapPin, Pencil, RefreshCw, Moon, CalendarClock, Layers, Navigation, Timer,
  MessageCircle, Phone,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

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
  delivery_mode: {
    label: "Delivery Mode",
    description: "Choose between instant, scheduled-only, or both delivery modes",
    icon: Truck,
  },
  instant_delivery_enabled: {
    label: "Instant Delivery",
    description: "Allow customers to choose instant delivery option",
    icon: Zap,
  },
  minimum_order_value: {
    label: "Minimum Order Value",
    description: "Set the minimum cart value required to place an order",
    icon: DollarSign,
  },
  free_delivery_threshold: {
    label: "Free Delivery Threshold",
    description: "Orders above this amount qualify for free delivery",
    icon: Gift,
  },
  delivery_radius_km: {
    label: "Delivery Radius (km)",
    description: "Maximum delivery distance from the store",
    icon: MapPin,
  },
  max_orders_per_hour: {
    label: "Max Orders Per Hour",
    description: "Throttle incoming orders when capacity is reached",
    icon: Clock,
  },
  surge_pricing_enabled: {
    label: "Surge Pricing",
    description: "Apply dynamic pricing multiplier during high demand periods",
    icon: TrendingUp,
  },
  tip_enabled: {
    label: "Tips",
    description: "Allow customers to add a tip for delivery partners",
    icon: Heart,
  },
  wallet_topup_enabled: {
    label: "Wallet Top-up",
    description: "Enable in-app wallet recharge for customers",
    icon: Wallet,
  },
  reviews_enabled: {
    label: "Reviews",
    description: "Allow customers to leave product and delivery reviews",
    icon: Star,
  },
  referral_enabled: {
    label: "Referral Program",
    description: "Enable referral rewards for both sender and receiver",
    icon: Users,
  },
  multi_language_enabled: {
    label: "Multi-Language",
    description: "Enable language selection for the customer app",
    icon: Globe,
  },
  express_checkout_enabled: {
    label: "Express Checkout",
    description: "Allow one-tap checkout with saved address and payment method",
    icon: ShoppingCart,
  },
  store_open_hours: {
    label: "Store Open Hours",
    description: "Configure store operating hours with auto-toggle support",
    icon: Store,
  },
  maintenance_mode: {
    label: "Maintenance Mode",
    description: "Temporarily disable ordering with a custom message",
    icon: AlertTriangle,
  },
  cod_enabled: {
    label: "Cash on Delivery",
    description: "Allow customers to pay with cash on delivery",
    icon: CreditCard,
  },
  upi_on_delivery_enabled: {
    label: "UPI on Delivery",
    description: "Allow customers to pay via UPI at the time of delivery",
    icon: Smartphone,
  },
  new_user_discount: {
    label: "New User Discount",
    description: "Offer a signup discount for first-time customers",
    icon: Gift,
  },
  delivery_partner_assignment: {
    label: "Delivery Partner Assignment",
    description: "Choose how delivery partners are assigned to orders",
    icon: RefreshCw,
  },
  order_edit_window_minutes: {
    label: "Order Edit Window",
    description: "Minutes after placing an order during which customer can edit it",
    icon: Pencil,
  },
  substitute_approval_mode: {
    label: "Substitute Approval Mode",
    description: "How to handle item substitutions when an item is out of stock",
    icon: Package,
  },
  dark_store_mode: {
    label: "Dark Store Mode",
    description: "Operate as a dark store (no walk-in customers, delivery only)",
    icon: Moon,
  },
  slot_only_mode: {
    label: "Slot-Only Mode",
    description: "Only allow scheduled slot deliveries (no instant delivery)",
    icon: CalendarClock,
  },
  max_items_per_order: {
    label: "Max Items Per Order",
    description: "Limit the number of items a customer can add to one order",
    icon: Layers,
  },
  live_tracking_enabled: {
    label: "Live Tracking",
    description: "Enable real-time delivery tracking for customers",
    icon: Navigation,
  },
  eta_display_mode: {
    label: "ETA Display Mode",
    description: "Control when ETA is shown: always or only after rider assignment",
    icon: Timer,
  },
  whatsapp_enabled: {
    label: "WhatsApp Notifications",
    description: "Send OTPs and order updates via WhatsApp Business API",
    icon: MessageCircle,
  },
  sms_enabled: {
    label: "SMS Notifications",
    description: "Send OTPs and order updates via SMS",
    icon: Phone,
  },
};

const FLAG_CATEGORIES: { title: string; keys: string[]; color: string }[] = [
  {
    title: "Delivery",
    keys: ["delivery_mode", "instant_delivery_enabled", "delivery_radius_km", "delivery_partner_assignment", "slot_only_mode", "forced_accept_delivery"],
    color: "purple",
  },
  {
    title: "Orders",
    keys: ["minimum_order_value", "max_orders_per_hour", "max_items_per_order", "order_edit_window_minutes", "substitute_approval_mode", "express_checkout_enabled"],
    color: "blue",
  },
  {
    title: "Payments",
    keys: ["cod_enabled", "upi_on_delivery_enabled", "tip_enabled", "wallet_topup_enabled", "surge_pricing_enabled"],
    color: "green",
  },
  {
    title: "Customer Experience",
    keys: ["live_tracking_enabled", "eta_display_mode", "reviews_enabled", "referral_enabled", "new_user_discount", "multi_language_enabled"],
    color: "amber",
  },
  {
    title: "Notifications & Messaging",
    keys: ["whatsapp_enabled", "sms_enabled", "ring_alert_rules", "print_required_alert"],
    color: "indigo",
  },
  {
    title: "Operations",
    keys: ["stock_value_visible", "store_open_hours", "maintenance_mode", "dark_store_mode", "free_delivery_threshold"],
    color: "red",
  },
];

const CONFIG_HINTS: Record<string, Record<string, { type: "select" | "number" | "text" | "time" | "checkbox"; options?: string[]; suffix?: string; prefix?: string; label?: string }>> = {
  delivery_mode: { mode: { type: "select", options: ["both", "instant", "scheduled"], label: "Delivery Mode" } },
  delivery_radius_km: { value: { type: "number", suffix: "km", label: "Radius" } },
  minimum_order_value: { value: { type: "number", prefix: "\u20B9", label: "Minimum Amount" } },
  free_delivery_threshold: { value: { type: "number", prefix: "\u20B9", label: "Threshold" } },
  max_orders_per_hour: { value: { type: "number", suffix: "orders/hr", label: "Limit" }, action: { type: "select", options: ["queue", "reject"], label: "When Exceeded" } },
  surge_pricing_enabled: { multiplier: { type: "number", suffix: "\u00D7", label: "Multiplier" }, message: { type: "text", label: "Display Message" } },
  delivery_partner_assignment: { mode: { type: "select", options: ["nearest", "round_robin", "manual"], label: "Assignment Mode" } },
  eta_display_mode: { mode: { type: "select", options: ["always", "after_assignment"], label: "Show ETA" } },
  substitute_approval_mode: { mode: { type: "select", options: ["always_ask", "auto_accept", "auto_reject"], label: "Substitution Handling" } },
  store_open_hours: { open: { type: "time", label: "Opens At" }, close: { type: "time", label: "Closes At" }, autoToggle: { type: "checkbox", label: "Auto-toggle store status" } },
  max_items_per_order: { value: { type: "number", suffix: "items", label: "Maximum" } },
  order_edit_window_minutes: { value: { type: "number", suffix: "minutes", label: "Edit Window" } },
  new_user_discount: { percent: { type: "number", suffix: "%", label: "Discount" }, maxDiscount: { type: "number", prefix: "\u20B9", label: "Max Discount" }, minOrder: { type: "number", prefix: "\u20B9", label: "Min Order" } },
  referral_enabled: { senderReward: { type: "number", prefix: "\u20B9", label: "Sender Reward" }, receiverReward: { type: "number", prefix: "\u20B9", label: "Receiver Reward" } },
  maintenance_mode: { message: { type: "text", label: "Message" }, eta: { type: "text", label: "ETA (optional)" } },
};

export function FeatureFlagSettings({ flags, deliveryPartners }: Props) {
  const [flagState, setFlagState] = useState<FlagData[]>(flags);
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useToast();

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
    <div className="space-y-8">
      {FLAG_CATEGORIES.map((category) => (
        <div key={category.title} className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 px-1">{category.title}</h2>
          <div className="space-y-3">
            {category.keys.map((flagKey) => {
              const flag = getFlag(flagKey);
              if (!flag) return null;

              // Custom sections for complex flags
              if (flagKey === "forced_accept_delivery") {
                return <ForcedAcceptCard key={flagKey} flag={flag} saving={saving === flagKey} updateFlag={updateFlag} deliveryPartners={deliveryPartners} forcedAcceptOverrides={forcedAcceptOverrides} isStaffForced={isStaffForced} toggleStaffOverride={toggleStaffOverride} />;
              }
              if (flagKey === "ring_alert_rules") {
                return <RingAlertCard key={flagKey} flag={flag} saving={saving === flagKey} updateFlag={updateFlag} ringConfig={ringConfig} />;
              }
              if (flagKey === "print_required_alert") {
                return <PrintAlertCard key={flagKey} flag={flag} saving={saving === flagKey} updateFlag={updateFlag} printConfig={printConfig} />;
              }

              // Flags with config get a config card
              if (flag.config && typeof flag.config === "object") {
                return <SmartConfigFlagCard key={flagKey} flag={flag} saving={saving === flagKey} updateFlag={updateFlag} />;
              }

              // Simple boolean flags
              return (
                <FlagCard
                  key={flagKey}
                  flag={flag}
                  saving={saving === flagKey}
                  onToggle={(enabled) => updateFlag(flagKey, { enabled })}
                />
              );
            })}
          </div>
        </div>
      ))}
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
          role="switch"
          aria-label={meta.label}
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

/** Smart card for flags with JSON config - renders toggle + hint-based config fields */
function SmartConfigFlagCard({
  flag,
  saving,
  updateFlag,
}: {
  flag: FlagData;
  saving: boolean;
  updateFlag: (key: string, updates: { enabled?: boolean; config?: Record<string, unknown> | null }) => Promise<void>;
}) {
  const meta = FLAG_META[flag.key] ?? { label: flag.key, description: "", icon: Settings };
  const Icon = meta.icon;
  const config = flag.config as Record<string, unknown> | null;
  const hints = CONFIG_HINTS[flag.key];

  function formatOptionLabel(value: string): string {
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function renderHintField(cfgKey: string, hint: { type: "select" | "number" | "text" | "time" | "checkbox"; options?: string[]; suffix?: string; prefix?: string; label?: string }) {
    const currentValue = config?.[cfgKey];
    const fieldLabel = hint.label ?? cfgKey.replace(/([A-Z])/g, " $1");

    if (hint.type === "select") {
      return (
        <label key={cfgKey} className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{fieldLabel}</span>
          <select
            defaultValue={currentValue != null ? String(currentValue) : hint.options?.[0] ?? ""}
            onChange={(e) => { updateFlag(flag.key, { config: { ...config, [cfgKey]: e.target.value } }); }}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
          >
            {hint.options?.map((opt) => (
              <option key={opt} value={opt}>{formatOptionLabel(opt)}</option>
            ))}
          </select>
        </label>
      );
    }

    if (hint.type === "number") {
      return (
        <label key={cfgKey} className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{fieldLabel}</span>
          <div className="mt-1 flex items-center gap-1">
            {hint.prefix && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{hint.prefix}</span>}
            <input
              type="number"
              defaultValue={currentValue != null ? String(currentValue) : ""}
              onBlur={(e) => {
                const parsed = Number(e.target.value) || 0;
                updateFlag(flag.key, { config: { ...config, [cfgKey]: parsed } });
              }}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
            />
            {hint.suffix && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{hint.suffix}</span>}
          </div>
        </label>
      );
    }

    if (hint.type === "text") {
      return (
        <label key={cfgKey} className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{fieldLabel}</span>
          <input
            type="text"
            defaultValue={currentValue != null ? String(currentValue) : ""}
            onBlur={(e) => { updateFlag(flag.key, { config: { ...config, [cfgKey]: e.target.value.trim() } }); }}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
          />
        </label>
      );
    }

    if (hint.type === "time") {
      return (
        <label key={cfgKey} className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{fieldLabel}</span>
          <input
            type="time"
            defaultValue={currentValue != null ? String(currentValue) : ""}
            onChange={(e) => { updateFlag(flag.key, { config: { ...config, [cfgKey]: e.target.value } }); }}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
          />
        </label>
      );
    }

    if (hint.type === "checkbox") {
      return (
        <label key={cfgKey} className="flex items-center gap-2 py-1">
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              role="switch"
              aria-label={fieldLabel}
              checked={currentValue === true}
              onChange={(e) => { updateFlag(flag.key, { config: { ...config, [cfgKey]: e.target.checked } }); }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{fieldLabel}</span>
        </label>
      );
    }

    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-5 flex items-center justify-between">
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
            role="switch"
            aria-label={meta.label}
            checked={flag.enabled}
            onChange={(e) => updateFlag(flag.key, { enabled: e.target.checked })}
            disabled={saving}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>
      {config && Object.keys(config).length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            {hints
              ? Object.entries(hints).map(([cfgKey, hint]) => renderHintField(cfgKey, hint))
              : Object.entries(config).map(([cfgKey, cfgValue]) => (
                  <label key={cfgKey} className="block">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{cfgKey.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type={typeof cfgValue === "number" ? "number" : "text"}
                      defaultValue={cfgValue != null ? String(cfgValue) : ""}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        let parsed: unknown = raw;
                        if (typeof cfgValue === "number") parsed = Number(raw) || 0;
                        else if (typeof cfgValue === "boolean") parsed = raw === "true";
                        updateFlag(flag.key, { config: { ...config, [cfgKey]: parsed } });
                      }}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
                    />
                  </label>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Forced Accept Delivery - custom card with per-staff overrides */
function ForcedAcceptCard({
  flag,
  saving,
  updateFlag,
  deliveryPartners,
  forcedAcceptOverrides,
  isStaffForced,
  toggleStaffOverride,
}: {
  flag: FlagData;
  saving: boolean;
  updateFlag: (key: string, updates: { enabled?: boolean; config?: Record<string, unknown> | null }) => Promise<void>;
  deliveryPartners: DeliveryPartner[];
  forcedAcceptOverrides: Array<{ userId: string; enabled: boolean }>;
  isStaffForced: (userId: string) => boolean;
  toggleStaffOverride: (userId: string, enabled: boolean) => Promise<void>;
}) {
  return (
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
          <input type="checkbox" role="switch" aria-label="Forced Accept Delivery" checked={flag.enabled} onChange={(e) => updateFlag("forced_accept_delivery", { enabled: e.target.checked })} disabled={saving} className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
        </label>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Per-Staff Override</p>
        <p className="text-xs text-slate-400 mb-3">
          {flag.enabled ? "Global is ON - staff below with toggle OFF are exempt" : "Global is OFF - staff below with toggle ON are forced-accept regardless"}
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {deliveryPartners.map((partner) => (
            <div key={partner.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{partner.name}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" role="switch" aria-label={`Force accept for ${partner.name}`} checked={isStaffForced(partner.id)} onChange={(e) => toggleStaffOverride(partner.id, e.target.checked)} disabled={saving} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          ))}
          {deliveryPartners.length === 0 && <p className="text-xs text-slate-400 italic">No delivery partners found</p>}
        </div>
      </div>
    </div>
  );
}

/** Ring Alert Rules - custom card with config fields */
function RingAlertCard({
  flag,
  saving,
  updateFlag,
  ringConfig,
}: {
  flag: FlagData;
  saving: boolean;
  updateFlag: (key: string, updates: { enabled?: boolean; config?: Record<string, unknown> | null }) => Promise<void>;
  ringConfig: { ringtone?: string; durationSeconds?: number; escalationAfterSeconds?: number; escalationTarget?: string } | null;
}) {
  return (
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
          <input type="checkbox" role="switch" aria-label="Ring Alert Rules" checked={flag.enabled} onChange={(e) => updateFlag("ring_alert_rules", { enabled: e.target.checked })} disabled={saving} className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
        </label>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Ringtone</span>
          <input type="text" defaultValue={ringConfig?.ringtone ?? "default"} onBlur={(e) => { updateFlag("ring_alert_rules", { config: { ...ringConfig, ringtone: e.target.value.trim() || "default" } }); }} className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Duration (seconds)</span>
          <input type="number" min={5} max={120} defaultValue={ringConfig?.durationSeconds ?? 30} onBlur={(e) => { updateFlag("ring_alert_rules", { config: { ...ringConfig, durationSeconds: Math.max(5, Math.min(120, Number(e.target.value) || 30)) } }); }} className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Escalation After (seconds)</span>
          <input type="number" min={10} max={300} defaultValue={ringConfig?.escalationAfterSeconds ?? 60} onBlur={(e) => { updateFlag("ring_alert_rules", { config: { ...ringConfig, escalationAfterSeconds: Math.max(10, Math.min(300, Number(e.target.value) || 60)) } }); }} className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Escalation Target</span>
          <select defaultValue={ringConfig?.escalationTarget ?? "admin"} onChange={(e) => { updateFlag("ring_alert_rules", { config: { ...ringConfig, escalationTarget: e.target.value } }); }} className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm">
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="all_staff">All Staff</option>
          </select>
        </label>
      </div>
    </div>
  );
}

/** Print Required Alert - custom card with threshold config */
function PrintAlertCard({
  flag,
  saving,
  updateFlag,
  printConfig,
}: {
  flag: FlagData;
  saving: boolean;
  updateFlag: (key: string, updates: { enabled?: boolean; config?: Record<string, unknown> | null }) => Promise<void>;
  printConfig: { thresholdMinutes?: number } | null;
}) {
  return (
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
          <input type="checkbox" role="switch" aria-label="Print Required Alert" checked={flag.enabled} onChange={(e) => updateFlag("print_required_alert", { enabled: e.target.checked })} disabled={saving} className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
        </label>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
        <label className="block max-w-xs">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Threshold (minutes)</span>
          <input type="number" min={1} max={120} defaultValue={printConfig?.thresholdMinutes ?? 10} onBlur={(e) => { updateFlag("print_required_alert", { config: { thresholdMinutes: Math.max(1, Math.min(120, Number(e.target.value) || 10)) } }); }} className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm" />
          <p className="mt-1 text-xs text-slate-400">Orders unprinted longer than this will trigger a dashboard alert</p>
        </label>
      </div>
    </div>
  );
}
