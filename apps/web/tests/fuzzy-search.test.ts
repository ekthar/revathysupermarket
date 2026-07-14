import assert from "node:assert/strict";
import test from "node:test";
import { levenshteinDistance, trigramSimilarity } from "../lib/search/fuzzy";
import { scoreResult, rankResults } from "../lib/search/relevance";

// --- levenshteinDistance tests ---

test("levenshteinDistance returns 0 for identical strings", () => {
  assert.equal(levenshteinDistance("apple", "apple"), 0);
});

test("levenshteinDistance is case-insensitive", () => {
  assert.equal(levenshteinDistance("Apple", "apple"), 0);
  assert.equal(levenshteinDistance("BANANA", "banana"), 0);
});

test("levenshteinDistance returns string length for empty comparison", () => {
  assert.equal(levenshteinDistance("hello", ""), 5);
  assert.equal(levenshteinDistance("", "world"), 5);
});

test("levenshteinDistance returns 0 for two empty strings", () => {
  assert.equal(levenshteinDistance("", ""), 0);
});

test("levenshteinDistance calculates single character difference", () => {
  assert.equal(levenshteinDistance("cat", "car"), 1);
  assert.equal(levenshteinDistance("cat", "cats"), 1);
  assert.equal(levenshteinDistance("cat", "at"), 1);
});

test("levenshteinDistance calculates multi-character differences", () => {
  assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  assert.equal(levenshteinDistance("saturday", "sunday"), 3);
});

test("levenshteinDistance handles common misspellings", () => {
  // "tomato" -> "tometo" (1 substitution)
  assert.equal(levenshteinDistance("tomato", "tometo"), 1);
  // "banana" -> "bananna" (1 insertion)
  assert.equal(levenshteinDistance("banana", "bananna"), 1);
  // "onion" -> "onin" (1 deletion)
  assert.equal(levenshteinDistance("onion", "onin"), 1);
});

test("levenshteinDistance is symmetric", () => {
  assert.equal(
    levenshteinDistance("apple", "pineapple"),
    levenshteinDistance("pineapple", "apple")
  );
});

// --- trigramSimilarity tests ---

test("trigramSimilarity returns 1 for identical strings", () => {
  assert.equal(trigramSimilarity("apple", "apple"), 1);
});

test("trigramSimilarity is case-insensitive", () => {
  assert.equal(trigramSimilarity("Apple", "apple"), 1);
});

test("trigramSimilarity returns 0 for empty strings", () => {
  assert.equal(trigramSimilarity("", "apple"), 0);
  assert.equal(trigramSimilarity("apple", ""), 0);
  assert.equal(trigramSimilarity("", ""), 0);
});

test("trigramSimilarity returns high value for similar strings", () => {
  const similarity = trigramSimilarity("apple", "aple");
  assert.ok(similarity >= 0.4, `Expected >= 0.4, got ${similarity}`);
});

test("trigramSimilarity returns low value for dissimilar strings", () => {
  const similarity = trigramSimilarity("apple", "zebra");
  assert.ok(similarity < 0.2, `Expected < 0.2, got ${similarity}`);
});

test("trigramSimilarity handles short strings gracefully", () => {
  // Strings shorter than 3 characters use the full string as a trigram
  const sim = trigramSimilarity("ab", "ab");
  assert.equal(sim, 1);
});

test("trigramSimilarity detects similarity in product-like names", () => {
  // "tomato" vs "tometo" - trigram overlap is partial but detectable
  const sim = trigramSimilarity("tomato", "tometo");
  assert.ok(sim > 0.2, `Expected > 0.2, got ${sim}`);

  // "banana" vs "bananna" - should be quite similar (shares many trigrams)
  const sim2 = trigramSimilarity("banana", "bananna");
  assert.ok(sim2 > 0.4, `Expected > 0.4, got ${sim2}`);
});

// --- scoreResult tests ---

test("scoreResult returns 100 for exact match", () => {
  assert.equal(scoreResult("apple", "Apple"), 100);
  assert.equal(scoreResult("Milk", "milk"), 100);
});

test("scoreResult returns 80 for starts-with match", () => {
  assert.equal(scoreResult("app", "Apple Juice"), 80);
  assert.equal(scoreResult("ban", "Banana"), 80);
});

test("scoreResult returns 60 for word-starts-with match", () => {
  assert.equal(scoreResult("juice", "Apple Juice Fresh"), 60);
  assert.equal(scoreResult("org", "Fresh Organic Milk"), 60);
});

test("scoreResult returns 40 for contains match", () => {
  assert.equal(scoreResult("ppl", "Apple"), 40);
  assert.equal(scoreResult("anan", "Banana"), 40);
});

test("scoreResult returns fuzzy score for misspellings", () => {
  const score = scoreResult("aple", "Apple");
  assert.ok(score > 0 && score <= 20, `Expected fuzzy score (0-20), got ${score}`);
});

test("scoreResult returns 0 for completely unrelated strings", () => {
  assert.equal(scoreResult("xyz123", "Apple"), 0);
  assert.equal(scoreResult("quantum", "Banana"), 0);
});

test("scoreResult returns 0 for empty query", () => {
  assert.equal(scoreResult("", "Apple"), 0);
});

test("scoreResult returns 0 for empty product name", () => {
  assert.equal(scoreResult("apple", ""), 0);
});

test("scoreResult handles multi-word queries against product names", () => {
  const score = scoreResult("fresh milk", "Fresh Milk 500ml");
  assert.ok(score >= 80, `Expected >= 80 for starts-with, got ${score}`);
});

// --- rankResults tests ---

test("rankResults sorts products by relevance score descending", () => {
  const products = [
    { name: "Pineapple", id: "1" },
    { name: "Apple", id: "2" },
    { name: "Apple Juice", id: "3" },
    { name: "Green Apple Fresh", id: "4" },
  ];

  const ranked = rankResults("apple", products);
  assert.ok(ranked.length > 0, "Should have results");
  // Exact match "Apple" should be first
  assert.equal(ranked[0].name, "Apple");
  // "Apple Juice" starts with query, should be second
  assert.equal(ranked[1].name, "Apple Juice");
  // Scores should be in descending order
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(
      ranked[i].relevanceScore <= ranked[i - 1].relevanceScore,
      `Expected descending order at index ${i}`
    );
  }
});

test("rankResults excludes products with zero score", () => {
  const products = [
    { name: "Apple", id: "1" },
    { name: "Zebra Stripes", id: "2" },
    { name: "Quantum Physics", id: "3" },
  ];

  const ranked = rankResults("apple", products);
  assert.ok(ranked.every((p) => p.relevanceScore > 0));
  assert.ok(!ranked.some((p) => p.name === "Zebra Stripes"));
  assert.ok(!ranked.some((p) => p.name === "Quantum Physics"));
});

test("rankResults returns empty array when no matches", () => {
  const products = [
    { name: "Milk", id: "1" },
    { name: "Bread", id: "2" },
  ];

  const ranked = rankResults("xyz123nonsense", products);
  assert.equal(ranked.length, 0);
});

test("rankResults includes relevanceScore in output", () => {
  const products = [{ name: "Apple", id: "1" }];
  const ranked = rankResults("apple", products);
  assert.ok(ranked.length === 1);
  assert.ok("relevanceScore" in ranked[0]);
  assert.equal(ranked[0].relevanceScore, 100);
});

test("rankResults handles common grocery misspellings", () => {
  const products = [
    { name: "Tomato", id: "1" },
    { name: "Potato", id: "2" },
    { name: "Onion", id: "3" },
    { name: "Carrot", id: "4" },
  ];

  // Misspelling: "tometo" should still match "Tomato"
  const ranked = rankResults("tometo", products);
  assert.ok(ranked.length > 0, "Should find fuzzy matches for misspellings");
  assert.equal(ranked[0].name, "Tomato");
});
