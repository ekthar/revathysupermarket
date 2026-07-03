import { prisma } from "@/lib/prisma";
import { featureFlags } from "@/prisma/feature-flags";

/**
 * Canonical, code-defined defaults keyed by flag key. These mirror
 * `prisma/feature-flags.ts` (the single source of truth used by the seed and
 * the settings-page self-heal) and act as a safety net for runtime reads: if a
 * flag row was never seeded in this environment, we fall back to its designed
 * default instead of silently treating the feature as OFF.
 */
const DEFAULT_ENABLED_BY_KEY: Record<string, boolean> = Object.fromEntries(
  featureFlags.map((flag) => [flag.key, flag.enabled]),
);

/**
 * Check if a feature flag is enabled at runtime.
 *
 * Resolution order:
 *  1. The DB row's `enabled` value (operator's live toggle).
 *  2. The canonical code default when the row is missing (unseeded env).
 *  3. `false` only for keys with no canonical default at all.
 *
 * This makes a forgotten `seed:flags` run non-fatal: a freshly added flag such
 * as `whatsapp_enabled` behaves per its intended default rather than vanishing.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flag = await prisma.featureFlag
    .findUnique({
      where: { key },
      select: { enabled: true },
    })
    .catch(() => null);

  if (flag) return flag.enabled;
  return DEFAULT_ENABLED_BY_KEY[key] ?? false;
}

export async function getFeatureFlag<TConfig = Record<string, unknown>>(
  key: string,
): Promise<{ enabled: boolean; config: TConfig | null }> {
  const flag = await prisma.featureFlag
    .findUnique({
      where: { key },
      select: { enabled: true, config: true },
    })
    .catch(() => null);

  if (flag) return { enabled: flag.enabled, config: flag.config as TConfig | null };

  const defaultFlag = featureFlags.find((entry) => entry.key === key);
  return {
    enabled: defaultFlag?.enabled ?? false,
    config: (defaultFlag?.config && typeof defaultFlag.config === "object" ? defaultFlag.config : null) as TConfig | null,
  };
}
