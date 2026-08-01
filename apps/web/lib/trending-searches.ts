import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Trending search terms.
 *
 * Replaces a hardcoded `["Rice","Milk","Eggs",…]` list with real demand signal.
 * Resolution order:
 *   1. Most-ordered product names over the trailing window (true demand)
 *   2. Most popular active products (catalogue signal, for new stores with no orders)
 *   3. A small static list (empty catalogue / DB unreachable)
 *
 * `OrderItem.name` is denormalised at order time, so step 1 needs no join and
 * keeps working for products that were later renamed or deleted.
 */

const TRENDING_WINDOW_DAYS = 30;
const TRENDING_LIMIT = 8;

const STATIC_FALLBACK = ["Rice", "Milk", "Eggs", "Onion", "Tomato", "Bread"];

async function computeTrendingTerms(): Promise<string[]> {
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // 1. Real demand — group order lines by product name.
  const ordered = await prisma.orderItem
    .groupBy({
      by: ["name"],
      where: { order: { createdAt: { gte: since } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: TRENDING_LIMIT,
    })
    .catch(() => []);

  const orderedTerms = ordered
    .map((row) => row.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (orderedTerms.length >= 4) return orderedTerms.slice(0, TRENDING_LIMIT);

  // 2. Catalogue signal — top popular products. Merged with any order-derived
  //    terms so a store with a couple of orders still gets a full row.
  const popular = await prisma.product
    .findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
      take: TRENDING_LIMIT,
    })
    .catch(() => []);

  const merged: string[] = [];
  const seen = new Set<string>();
  for (const term of [...orderedTerms, ...popular.map((p) => p.name)]) {
    const key = term.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(term.trim());
    if (merged.length >= TRENDING_LIMIT) break;
  }

  // 3. Nothing in the catalogue at all.
  return merged.length > 0 ? merged : STATIC_FALLBACK;
}

export const getTrendingSearchTerms = unstable_cache(
  computeTrendingTerms,
  ["trending-search-terms"],
  { revalidate: 900, tags: ["products", "orders"] }
);

export { STATIC_FALLBACK as FALLBACK_TRENDING_TERMS };
