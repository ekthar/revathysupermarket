import { getPublicShellSettings } from "@/lib/store-settings";

/**
 * Loading screen — minimal, branded, fast.
 *
 * Apple principle: content appears instantly. The loading state should be
 * as invisible as possible — just logo + subtle indicator. No flashy
 * gradients, pulsing blobs, or decorative animations.
 */
export default async function HomeLoading() {
  const { settings, logoUrl } = await getPublicShellSettings();

  return (
    <div className="min-h-[70dvh] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={settings.storeName}
            className="w-14 h-14 rounded-xl object-contain"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white">
            <span className="text-xl font-black text-white dark:text-neutral-900">{settings.storeName.charAt(0)}</span>
          </div>
        )}

        {/* Store name */}
        <h1 className="mt-4 font-display text-lg font-black tracking-tight text-neutral-900 dark:text-white">
          {settings.storeName}
        </h1>

        {/* Loading dots */}
        <div className="flex items-center gap-1 mt-6">
          <div className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
