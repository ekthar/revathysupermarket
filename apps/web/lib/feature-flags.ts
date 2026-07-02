import { prisma } from "@/lib/prisma";

/**
 * Check if a feature flag is enabled at runtime.
 * Returns false if the flag does not exist.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { enabled: true },
  });
  return flag?.enabled ?? false;
}
