import assert from "node:assert/strict";
import test from "node:test";

import { products } from "../lib/products.js";

/**
 * Regression test: ensures the static products array maintains a consistent
 * count and that all products have required fields. This guards against
 * accidental truncation (the bug where only 8 products rendered).
 */

test("static products array contains 50 items", () => {
  assert.equal(products.length, 50);
});

test("every product has required fields", () => {
  for (const product of products) {
    assert.ok(product.id, `missing id for product: ${JSON.stringify(product)}`);
    assert.ok(product.slug, `missing slug for product: ${product.id}`);
    assert.ok(product.name, `missing name for product: ${product.id}`);
    assert.ok(product.category, `missing category for product: ${product.id}`);
    assert.ok(product.price > 0, `invalid price for product: ${product.id}`);
    assert.ok(product.image, `missing image for product: ${product.id}`);
    assert.ok(product.description, `missing description for product: ${product.id}`);
    assert.ok(product.stock >= 0, `invalid stock for product: ${product.id}`);
    assert.ok(product.unit, `missing unit for product: ${product.id}`);
  }
});

test("all product IDs are unique", () => {
  const ids = products.map((p) => p.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, "duplicate product IDs found");
});

test("all product slugs are unique", () => {
  const slugs = products.map((p) => p.slug);
  const uniqueSlugs = new Set(slugs);
  assert.equal(slugs.length, uniqueSlugs.size, "duplicate product slugs found");
});
