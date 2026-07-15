"use client";

import { Gift, Star, Crown, Trophy } from "lucide-react";
import Link from "next/link";

const TIERS = [
  { name: "Bronze", min: 0, max: 199, color: "from-amber-700 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", icon: Star },
  { name: "Silver", min: 200, max: 499, color: "from-slate-400 to-slate-500", bg: "bg-slate-50 dark:bg-slate-900/30", text: "text-slate-600 dark:text-slate-300", icon: Trophy },
  { name: "Gold", min: 500, max: Infinity, color: "from-yellow-400 to-amber-500", bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-700 dark:text-yellow-400", icon: Crown },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points <= t.max) || TIERS[0];
}

function getNextTier(points: number) {
  const currentIndex = TIERS.findIndex((t) => points >= t.min && points <= t.max);
  return currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null;
}

export function LoyaltyProgressBar({ points, nextRewardAt }: { points: number; nextRewardAt: number }) {
  if (points === 0 && nextRewardAt === 0) return null;

  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const TierIcon = tier.icon;
  const progress = Math.min((points / nextRewardAt) * 100, 100);
  const remaining = Math.max(nextRewardAt - points, 0);

  // Tier progress (how far to next tier)
  const tierProgress = nextTier
    ? Math.min(((points - tier.min) / (nextTier.min - tier.min)) * 100, 100)
    : 100;

  return (
    <Link href="/account/loyalty" className="block">
      <div className={`rounded-2xl border border-neutral-200/50 ${tier.bg} px-4 py-3 dark:border-neutral-700/50`}>
        {/* Tier badge + points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${tier.color}`}>
              <TierIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${tier.text}`}>{tier.name}</span>
              <span className="ml-2 text-sm font-bold text-neutral-900 dark:text-white">{points} pts</span>
            </div>
          </div>
          {nextTier && (
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              {nextTier.min - points} to {nextTier.name}
            </span>
          )}
        </div>

        {/* Tier progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all duration-700`}
              style={{ width: `${tierProgress}%` }}
            />
          </div>
          {nextTier && (
            <span className="text-[10px] font-bold text-neutral-400">{nextTier.name}</span>
          )}
        </div>

        {/* Reward progress */}
        {remaining > 0 && (
          <p className="mt-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            <Gift className="inline h-3 w-3 -mt-0.5 mr-0.5" />
            {remaining} more points for ₹50 reward
          </p>
        )}
        {remaining === 0 && (
          <p className="mt-1.5 text-[11px] font-bold text-green-600 dark:text-green-400">
            🎉 Reward available! Redeem at checkout
          </p>
        )}
      </div>
    </Link>
  );
}
