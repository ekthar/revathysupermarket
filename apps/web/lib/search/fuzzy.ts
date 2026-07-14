/**
 * Fuzzy string matching utilities for product search.
 * Pure functions with no external dependencies.
 */

/**
 * Calculates the Levenshtein (edit) distance between two strings.
 * The distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into the other.
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 0;
  if (aLower.length === 0) return bLower.length;
  if (bLower.length === 0) return aLower.length;

  // Use a single-row DP approach for space efficiency
  const bLen = bLower.length;
  let prev = Array.from({ length: bLen + 1 }, (_, i) => i);
  let curr = new Array<number>(bLen + 1);

  for (let i = 1; i <= aLower.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= bLen; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[bLen];
}

/**
 * Extracts character trigrams from a string.
 * Example: "apple" -> ["app", "ppl", "ple"]
 */
function getTrigrams(str: string): Set<string> {
  const lower = str.toLowerCase();
  const trigrams = new Set<string>();
  if (lower.length < 3) {
    // For very short strings, use the string itself as the only trigram
    if (lower.length > 0) {
      trigrams.add(lower);
    }
    return trigrams;
  }
  for (let i = 0; i <= lower.length - 3; i++) {
    trigrams.add(lower.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates trigram similarity between two strings using the Dice coefficient.
 * Returns a value between 0 (completely different) and 1 (identical trigram sets).
 */
export function trigramSimilarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a.toLowerCase() === b.toLowerCase()) return 1;

  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const trigram of trigramsA) {
    if (trigramsB.has(trigram)) {
      intersection++;
    }
  }

  // Dice coefficient: 2 * |intersection| / (|A| + |B|)
  return (2 * intersection) / (trigramsA.size + trigramsB.size);
}
