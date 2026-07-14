"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tag,
  Gift,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { copyToClipboard } from "@/lib/clipboard";
import { haptic } from "@/lib/haptics";
import { formatCurrency } from "@/lib/utils";

// ---------- Types ----------

type SerializedOffer = {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  categoryId: string | null;
  productId: string | null;
  minQuantity: number;
  maxDiscount: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  image: string | null;
  badge: string | null;
};

type SerializedPromoCode = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minimumOrder: number;
  isActive: boolean;
  expiresAt: string | null;
};

type FilterTab = "all" | "offers" | "promos";

interface OffersClientProps {
  offers: SerializedOffer[];
  promoCodes: SerializedPromoCode[];
  catMap: Record<string, string>;
  isLoggedIn: boolean;
}

// ---------- Sub-components ----------

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const { hours, minutes, seconds, isExpired } = useCountdown(expiresAt);

  if (isExpired) return null;

  // Only show for offers expiring within 24 hours
  const totalHours = hours;
  if (totalHours >= 24) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
      aria-label={`Expires in ${hours} hours ${minutes} minutes ${seconds} seconds`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums">
        {String(totalHours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </span>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      haptic("light");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? `Copied ${code}` : `Tap to copy code ${code}`}
      className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 active:scale-95"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 animate-in fade-in" aria-hidden="true" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span>Tap to copy</span>
        </>
      )}
    </button>
  );
}

// ---------- Main Component ----------

export function OffersClient({ offers, promoCodes, catMap, isLoggedIn }: OffersClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "offers", label: "Category Offers" },
    { id: "promos", label: "Promo Codes" }
  ];

  const showOffers = activeTab === "all" || activeTab === "offers";
  const showPromos = activeTab === "all" || activeTab === "promos";

  const filteredOffers = showOffers ? offers : [];
  const filteredPromos = showPromos ? promoCodes : [];

  const isEmpty = filteredOffers.length === 0 && filteredPromos.length === 0;

  return (
    <main className="min-h-[100dvh] bg-[#F7F7FA] dark:bg-[#020617]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-white dark:bg-neutral-900">
          {/* Animated green gradient background */}
          <div
            className="absolute inset-0 opacity-60 dark:opacity-30 animate-gradient-shift"
            style={{
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(34,197,94,0.08) 25%, rgba(16,185,129,0.12) 50%, rgba(34,197,94,0.06) 75%, rgba(16,185,129,0.1) 100%)",
              backgroundSize: "200% 200%"
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.03em] text-foreground">
              Offers & Deals
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-lg">
              Exclusive discounts on your favorite groceries
            </p>
            {isLoggedIn && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary-50 dark:bg-secondary-900/30 px-4 py-2">
                <ShoppingBag className="h-4 w-4 text-secondary-600 dark:text-secondary-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  Save more with every order
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Filter Tabs */}
        <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Offer filters">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              aria-label={`Filter by ${tab.label}`}
              className={`min-h-[44px] px-5 rounded-full font-medium text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 ${
                activeTab === tab.id
                  ? "bg-[#050505] text-white dark:bg-white dark:text-black"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="mt-6 space-y-8">
            {/* Offer Cards */}
            {filteredOffers.length > 0 && (
              <section aria-label="Category offers">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOffers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} catMap={catMap} />
                  ))}
                </div>
              </section>
            )}

            {/* Promo Code Cards */}
            {filteredPromos.length > 0 && (
              <section aria-label="Promo codes">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPromos.map((promo) => (
                    <PromoCard key={promo.id} promo={promo} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ---------- Offer Card ----------

function OfferCard({
  offer,
  catMap
}: {
  offer: SerializedOffer;
  catMap: Record<string, string>;
}) {
  const isActive = offer.isActive;
  const accentColor = isActive ? "bg-[#22C55E]" : "bg-neutral-300 dark:bg-neutral-600";

  return (
    <article
      className="relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow"
      aria-label={`Offer: ${offer.title}`}
    >
      {/* Semi-circular cutouts - ticket tear effect */}
      <div
        className="absolute left-[3px] top-[-6px] w-3 h-3 rounded-full bg-background z-10"
        aria-hidden="true"
      />
      <div
        className="absolute left-[3px] bottom-[-6px] w-3 h-3 rounded-full bg-background z-10"
        aria-hidden="true"
      />

      <div className="flex h-full">
        {/* Left accent strip */}
        <div className={`w-1 shrink-0 ${accentColor}`} aria-hidden="true" />

        {/* Dashed perforation border */}
        <div className="border-l-2 border-dashed border-neutral-200 dark:border-neutral-700 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Discount value */}
              <p className="text-2xl font-black tabular-nums text-secondary-500">
                {offer.discountType === "percentage"
                  ? `${offer.discountValue}% OFF`
                  : `${formatCurrency(offer.discountValue)} OFF`}
              </p>
              {offer.maxDiscount && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Up to {formatCurrency(offer.maxDiscount)}
                </p>
              )}
            </div>

            {/* Image thumbnail */}
            {offer.image && (
              <Image
                src={offer.image}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
                unoptimized
              />
            )}
          </div>

          {/* Title and description */}
          <h3 className="mt-3 font-bold text-foreground text-sm leading-tight">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {offer.description}
            </p>
          )}

          {/* Auto-applied text */}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Auto-applied at checkout
          </p>

          {/* Bottom row: category badge + countdown */}
          <div className="mt-3 flex items-center flex-wrap gap-2">
            {offer.categoryId && catMap[offer.categoryId] && (
              <span className="rounded-full bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 px-2.5 py-0.5 text-[11px] font-medium">
                {catMap[offer.categoryId]}
              </span>
            )}
            {offer.badge && (
              <span className="rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-medium">
                {offer.badge}
              </span>
            )}
            {offer.expiresAt && <CountdownBadge expiresAt={offer.expiresAt} />}
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------- Promo Code Card ----------

function PromoCard({ promo }: { promo: SerializedPromoCode }) {
  return (
    <article
      className="rounded-2xl border-2 border-dashed border-secondary-200 dark:border-secondary-800 p-4 bg-white dark:bg-neutral-900"
      aria-label={`Promo code: ${promo.code}`}
    >
      {/* Code display */}
      <p className="font-mono text-lg font-black tracking-wider text-secondary-600 dark:text-secondary-400">
        {promo.code}
      </p>

      {/* Discount details */}
      <p className="mt-2 text-sm font-semibold text-foreground">
        {promo.discountType === "percentage"
          ? `${promo.discountValue}% off`
          : `${formatCurrency(promo.discountValue)} off`}
      </p>

      {/* Description */}
      {promo.description && (
        <p className="mt-1 text-xs text-muted-foreground">{promo.description}</p>
      )}

      {/* Minimum order */}
      {promo.minimumOrder > 0 && (
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">
          Min. order: {formatCurrency(promo.minimumOrder)}
        </p>
      )}

      {/* Copy button */}
      <div className="mt-3">
        <CopyButton code={promo.code} />
      </div>
    </article>
  );
}

// ---------- Empty State ----------

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center px-4">
      <div className="relative w-20 h-20">
        <Tag
          className="absolute top-0 left-2 h-10 w-10 text-muted-foreground/40 -rotate-12"
          aria-hidden="true"
        />
        <Gift
          className="absolute bottom-0 right-2 h-10 w-10 text-muted-foreground/30 rotate-6"
          aria-hidden="true"
        />
      </div>
      <h2 className="mt-6 text-lg font-bold text-foreground">
        No offers found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        Check back soon! We regularly add new deals and discounts for you.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center gap-2 min-h-[44px] px-6 rounded-full bg-[#050505] dark:bg-white text-white dark:text-black text-sm font-bold transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500"
        aria-label="Browse products"
      >
        Browse Products
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
