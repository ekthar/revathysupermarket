"use client";
import { useState } from "react";
import { useToast } from "@/components/toast-provider";
import type { LoyaltyConfig } from "@/lib/loyalty-config";

export function LoyaltySettingsClient({ initialConfig }: { initialConfig: LoyaltyConfig }) {
  const { showToast } = useToast();
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [adjustment, setAdjustment] = useState({ identifier: "", points: "", reason: "" });
  const [tiers, setTiers] = useState([
    { name: "Bronze", min: 0, max: 199 },
    { name: "Silver", min: 200, max: 499 },
    { name: "Gold", min: 500, max: 99999 },
  ]);
  const [tierSaving, setTierSaving] = useState(false);

  // Load tier config on mount
  useState(() => {
    fetch("/api/admin/loyalty/tiers")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.tiers) setTiers(data.tiers); })
      .catch(() => {});
  });

  async function saveTiers() {
    setTierSaving(true);
    const response = await fetch("/api/admin/loyalty/tiers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiers }),
    });
    setTierSaving(false);
    showToast(response.ok ? "Tier settings saved" : "Failed to save tiers", response.ok ? "success" : "error");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/loyalty", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    showToast(
      response.ok ? "Loyalty settings saved" : data.error ?? "Loyalty settings failed",
      response.ok ? "success" : "error"
    );
  }

  async function adjust(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adjustment),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    showToast(
      response.ok ? `Points updated. New balance: ${data.balance}` : data.error ?? "Adjustment failed",
      response.ok ? "success" : "error"
    );
    if (response.ok) setAdjustment({ identifier: "", points: "", reason: "" });
  }

  // Clear labels showing exactly what each number means
  const fields: Array<[keyof LoyaltyConfig, string, string, string]> = [
    [
      "earnRupeesPerPoint",
      "Rupees spent to earn 1 point",
      "e.g. 10 → customer spends ₹10 and earns 1 point",
      "1",
    ],
    [
      "pointValueRupees",
      "Value of 1 point in rupees (₹)",
      "e.g. 0.25 → 1 point = ₹0.25, so 4 points = ₹1 discount",
      "0.01",
    ],
    [
      "maxRedemptionPercent",
      "Max % of order payable with points",
      "e.g. 20 → customer can use points to pay up to 20% of the order total",
      "1",
    ],
    [
      "referralRewardPoints",
      "Referral bonus points (both users)",
      "Both the referrer and the new customer each get this many points after the first delivery",
      "1",
    ],
    [
      "pointExpiryDays",
      "Points expire after (days)",
      "Points are expired if unused for this many days. Set 0 to never expire. e.g. 365 = 1 year",
      "1",
    ],
  ];

  // Live preview of the current settings in plain language
  const preview = [
    `Spend ₹${config.earnRupeesPerPoint} → earn 1 point`,
    `1 point = ₹${config.pointValueRupees} (${Math.round(1 / config.pointValueRupees)} points = ₹1)`,
    `Max ${config.maxRedemptionPercent}% of order payable with points`,
    `Referral bonus: ${config.referralRewardPoints} points each`,
  ].join("  •  ");

  return (
    <div className="mt-5 grid gap-4">
      <form onSubmit={save} className="rounded-3xl border border-border bg-card p-4 shadow-elevation-1">
        <h3 className="font-display text-2xl font-black">Loyalty &amp; referrals</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview: <span className="font-semibold text-foreground">{preview}</span>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map(([key, label, help, step]) => (
            <label key={key} className="text-sm font-bold">
              {label}
              <input
                type="number"
                min="0"
                step={step}
                value={config[key]}
                onChange={(event) =>
                  setConfig((current) => ({ ...current, [key]: Number(event.target.value) }))
                }
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3"
              />
              <span className="mt-1 block text-xs font-medium text-muted-foreground">{help}</span>
            </label>
          ))}
        </div>
        <button
          disabled={saving}
          className="mt-4 h-11 rounded-2xl bg-primary px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save loyalty settings"}
        </button>
      </form>

      <form onSubmit={adjust} className="rounded-3xl border border-border bg-card p-4 shadow-elevation-1">
        <h3 className="font-display text-xl font-black">Manual points adjustment</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use a positive number to add points, negative to deduct. Every adjustment is written to the
          audit log.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            required
            value={adjustment.identifier}
            onChange={(event) =>
              setAdjustment((current) => ({ ...current, identifier: event.target.value }))
            }
            placeholder="Customer email or phone"
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
          />
          <input
            required
            type="number"
            value={adjustment.points}
            onChange={(event) =>
              setAdjustment((current) => ({ ...current, points: event.target.value }))
            }
            placeholder="Points (+100 to add, -50 to deduct)"
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
          />
          <input
            required
            value={adjustment.reason}
            onChange={(event) =>
              setAdjustment((current) => ({ ...current, reason: event.target.value }))
            }
            placeholder="Reason (e.g. compensation)"
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <button
          disabled={saving}
          className="mt-3 h-11 rounded-2xl bg-foreground px-5 text-sm font-black text-background disabled:opacity-50"
        >
          Apply adjustment
        </button>
      </form>

      {/* Tier Configuration */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-elevation-1">
        <h3 className="font-display text-2xl font-black">Tier Configuration</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set point thresholds for each loyalty tier. Customers progress through tiers as they earn points.
        </p>
        <div className="mt-4 space-y-3">
          {tiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3 items-end">
              <label className="text-sm font-bold">
                Tier Name
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => setTiers((prev) => prev.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))}
                  className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3"
                />
              </label>
              <label className="text-sm font-bold">
                Min Points
                <input
                  type="number"
                  min="0"
                  value={tier.min}
                  onChange={(e) => setTiers((prev) => prev.map((t, i) => i === idx ? { ...t, min: Number(e.target.value) } : t))}
                  className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3"
                />
              </label>
              <label className="text-sm font-bold">
                Max Points
                <input
                  type="number"
                  min="0"
                  value={tier.max}
                  onChange={(e) => setTiers((prev) => prev.map((t, i) => i === idx ? { ...t, max: Number(e.target.value) } : t))}
                  className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3"
                />
              </label>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTiers((prev) => [...prev, { name: "", min: prev.length > 0 ? prev[prev.length - 1].max + 1 : 0, max: 99999 }])}
              className="h-11 rounded-2xl border border-border px-5 text-sm font-bold text-muted-foreground"
            >
              + Add Tier
            </button>
            {tiers.length > 1 && (
              <button
                type="button"
                onClick={() => setTiers((prev) => prev.slice(0, -1))}
                className="h-11 rounded-2xl border border-red-200 px-5 text-sm font-bold text-red-600"
              >
                Remove Last
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={saveTiers}
          disabled={tierSaving}
          className="mt-4 h-11 rounded-2xl bg-primary px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {tierSaving ? "Saving…" : "Save tier settings"}
        </button>
      </div>
    </div>
  );
}
