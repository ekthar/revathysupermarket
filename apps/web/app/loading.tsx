import { getPublicShellSettings } from "@/lib/store-settings";

/**
 * Dynamic branded loading screen.
 * 
 * - Reflects store name and logo from settings (changes when admin updates them)
 * - Masks backend/database latency with a polished branded experience
 * - Pure CSS animations (zero JS overhead during loading)
 * - No layout shifts (fixed dimensions, no conditional rendering)
 * - Renders instantly as a Server Component with cached settings
 */
export default async function HomeLoading() {
  // Settings are cached (60s TTL) so this is near-instant
  const { settings, logoUrl } = await getPublicShellSettings();

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-neutral-50 to-secondary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-secondary-950/20" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary-200/40 dark:bg-secondary-800/20 blur-3xl animate-pulse" style={{ animationDuration: "3s" }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl animate-pulse" style={{ animationDuration: "4s", animationDelay: "1s" }} />
      </div>

      {/* Brand content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        {logoUrl ? (
          <div className="relative w-20 h-20 mb-5 animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={settings.storeName}
              className="w-20 h-20 rounded-2xl object-contain shadow-lg"
            />
            {/* Pulse ring around logo */}
            <div className="absolute inset-0 rounded-2xl border-2 border-secondary-300/50 dark:border-secondary-700/50 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        ) : (
          <div className="relative mb-5 animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg shadow-secondary-200 dark:shadow-secondary-900/30">
              <span className="text-3xl font-black text-white">{settings.storeName.charAt(0)}</span>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-secondary-300/50 dark:border-secondary-700/50 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        )}

        {/* Store name */}
        <h1 className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
          {settings.storeName}
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Fresh &amp; Fast Delivery
        </p>

        {/* Loading indicator — three bouncing dots */}
        <div className="flex items-center gap-1.5 mt-8">
          <div className="h-2 w-2 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
          <div className="h-2 w-2 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }} />
          <div className="h-2 w-2 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }} />
        </div>
      </div>

      {/* Bottom shimmer bar — mimics content loading */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 space-y-3 opacity-40">
        <div className="relative h-3 w-3/4 mx-auto overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
        </div>
        <div className="relative h-3 w-1/2 mx-auto overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.3s] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}
