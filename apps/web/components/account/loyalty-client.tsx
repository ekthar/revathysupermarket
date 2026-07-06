"use client";

import { useState } from "react";
import { Copy, Gift, Users } from "lucide-react";
import { useToast } from "@/components/toast-provider";

type Transaction = { id: string; points: number; reason: string; createdAt: string };

export function LoyaltyClient({
  balance,
  lifetimeEarned,
  referralCode,
  invited,
  pointValueRupees,
  referralRewardPoints,
  transactions,
}: {
  balance: number;
  lifetimeEarned: number;
  referralCode: string;
  invited: number;
  pointValueRupees: number;
  referralRewardPoints: number;
  transactions: Transaction[];
}) {
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const rupeeValue = (balance * pointValueRupees).toFixed(2);

  async function applyReferral() {
    setApplying(true);
    const response = await fetch("/api/account/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await response.json().catch(() => ({}));
    setApplying(false);
    showToast(
      response.ok ? "Referral code applied" : (data.error ?? "Referral code failed"),
      response.ok ? "success" : "error"
    );
  }

  return (
    <div className="space-y-4">
      {/* Points balance card */}
      <section className="rounded-3xl bg-gradient-to-br from-primary to-secondary-600 p-5 text-white shadow-lg">
        <p className="text-sm font-bold text-white/75">Available rewards</p>
        <p className="mt-1 font-display text-4xl font-black">{balance} points</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-1.5">
          <span className="text-sm font-black">= ₹{rupeeValue} off your next order</span>
        </div>
        <p className="mt-2 text-xs text-white/60">
          1 point = ₹{pointValueRupees} &nbsp;·&nbsp; {lifetimeEarned} lifetime points earned
        </p>
      </section>

      {/* Referral section */}
      <section className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-black">Invite friends</h2>
            <p className="text-sm text-muted-foreground">
              Both receive {referralRewardPoints} points after their first delivered order.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(referralCode);
            showToast("Referral code copied", "success");
          }}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 font-black text-primary"
        >
          <Copy className="h-4 w-4" />
          {referralCode}
        </button>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Users className="h-4 w-4" />
          {invited} friend{invited !== 1 ? "s" : ""} invited
        </p>
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Have a referral code?"
              maxLength={20}
              className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 text-sm font-bold"
            />
            <button
              type="button"
              disabled={applying || code.length < 6}
              onClick={applyReferral}
              className="h-11 rounded-2xl bg-primary px-4 text-sm font-black text-white disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {code.length > 0 && code.length < 6 && (
            <p className="mt-1 text-xs text-muted-foreground">Referral codes are at least 6 characters.</p>
          )}
        </div>
      </section>

      {/* Points history */}
      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className="font-black">Points history</h2>
        <div className="mt-3 divide-y divide-border">
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Points appear after your first delivered order.
            </p>
          ) : (
            transactions.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-bold">{entry.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className={entry.points >= 0 ? "font-black text-primary" : "font-black text-red-600"}>
                  {entry.points >= 0 ? "+" : ""}{entry.points}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
