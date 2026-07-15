"use client";

import { Gift } from "lucide-react";
import Link from "next/link";

export function LoyaltyProgressBar({ points, nextRewardAt }: { points: number; nextRewardAt: number }) {
  if (points === 0 && nextRewardAt === 0) return null;
  const progress = Math.min((points / nextRewardAt) * 100, 100);
  const remaining = Math.max(nextRewardAt - points, 0);

  return (
    <Link href="/account/loyalty" className="block">
      <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 dark:border-green-900/30 dark:from-green-950/30 dark:to-emerald-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">{points} points</span>
          </div>
          <span className="text-xs text-green-600 dark:text-green-400">
            {remaining > 0 ? `${remaining} more for ₹50 off` : "Reward available!"}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-green-200 dark:bg-green-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
