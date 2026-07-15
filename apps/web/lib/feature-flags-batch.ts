import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export async function getMultipleFlags(keys: string[]): Promise<Record<string, boolean>> {
  const flags = await prisma.featureFlag.findMany({
    where: { key: { in: keys } },
    select: { key: true, enabled: true }
  });
  const result: Record<string, boolean> = {};
  for (const key of keys) {
    result[key] = flags.find(f => f.key === key)?.enabled ?? false;
  }
  return result;
}

export const getCachedFlags = unstable_cache(
  async (keys: string[]) => getMultipleFlags(keys),
  ['feature-flags-batch'],
  { revalidate: 30 }
);
