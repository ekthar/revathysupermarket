"use client";

import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";

export function ReferralCard({
  referralCode,
  referralRewardPoints,
}: {
  referralCode: string;
  referralRewardPoints: number;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    const shareData = {
      title: "Get ₹50 off your first grocery order!",
      text: `Use my referral code ${referralCode} on MSM Supermarket and we both earn ${referralRewardPoints} points! 🛒`,
      url: typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : "",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or not supported - fall back to WhatsApp
        openWhatsApp(shareData.text, shareData.url);
      }
    } else {
      openWhatsApp(shareData.text, shareData.url);
    }
  }

  function openWhatsApp(text: string, url: string) {
    const message = encodeURIComponent(`${text}\n${url}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white">
      <h3 className="text-lg font-bold">Invite Friends, Earn ₹50</h3>
      <p className="mt-1 text-sm text-white/80">
        Share your code and earn {referralRewardPoints} points when they order
      </p>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-white/20 px-4 py-2 font-mono text-lg font-bold tracking-wider">
          {referralCode}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-50"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/30 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <Share2 className="h-4 w-4" />
        Share via WhatsApp / More
      </button>
    </div>
  );
}
