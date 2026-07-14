/**
 * Search result scoring and ranking for product search.
 * Provides relevance-based ordering: exact > starts-with > word-starts-with > contains > fuzzy.
 */

import { levenshteinDistance, trigramSimilarity } from "./fuzzy";

/** Minimum trigram similarity for a product to be considered a fuzzy match */
const FUZZY_THRESHOLD = 0.3;

/**
 * Scores a product name against a search query.
 * Returns a numeric score where higher is more relevant.
 *
 * Scoring tiers:
 * - Exact match: 100
 * - Starts with query: 80
 * - Word starts with query: 60
 * - Contains query: 40
 * - Fuzzy match (similarity > 0.3): 20 * similarity
 * - No match: 0
 */
export function scoreResult(query: string, productName: string): number {
  const q = query.toLowerCase().trim();
  const name = productName.toLowerCase().trim();

  if (!q || !name) return 0;

  // Exact match
  if (name === q) return 100;

  // Starts with query
  if (name.startsWith(q)) return 80;

  // Word starts with query (any word in the name starts with the query)
  const words = name.split(/\s+/);
  if (words.some((word) => word.startsWith(q))) return 60;

  // Contains query as substring
  if (name.includes(q)) return 40;

  // Fuzzy matching: use both trigram similarity and normalized Levenshtein distance
  const similarity = trigramSimilarity(q, name);
  if (similarity >= FUZZY_THRESHOLD) {
    return 20 * similarity;
  }

  // Also check individual words in the product name for fuzzy matches
  for (const word of words) {
    const wordSimilarity = trigramSimilarity(q, word);
    if (wordSimilarity >= FUZZY_THRESHOLD) {
      return 20 * wordSimilarity;
    }
    // Check Levenshtein distance for short queries
    if (q.length <= 8 && word.length <= 12) {
      const maxLen = Math.max(q.length, word.length);
      const distance = levenshteinDistance(q, word);
      const normalizedSim = 1 - distance / maxLen;
      if (normalizedSim >= FUZZY_THRESHOLD) {
        return 20 * normalizedSim;
      }
    }
  }

  return 0;
}

export type ScoredProduct<T> = T & { relevanceScore: number };

/**
 * Ranks products by relevance score against a search query.
 * Products with a score of 0 are excluded from results.
 * Returns products sorted by score descending.
 */
export function rankResults<T extends { name: string }>(
  query: string,
  products: T[]
): ScoredProduct<T>[] {
  return products
    .map((product) => ({
      ...product,
      relevanceScore: scoreResult(query, product.name),
    }))
    .filter((p) => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
