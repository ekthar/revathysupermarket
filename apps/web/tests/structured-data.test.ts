import assert from "node:assert/strict";
import test from "node:test";

import {
  organizationSchema,
  websiteSchema,
  productSchema,
  offerCatalogSchema,
  breadcrumbSchema,
} from "../lib/structured-data";

test("organizationSchema returns valid JSON-LD with @context and @type", () => {
  const schema = organizationSchema();

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "Organization");
  assert.ok(schema.name, "Should have a name");
  assert.ok(schema.url, "Should have a url");
});

test("websiteSchema returns valid JSON-LD with SearchAction", () => {
  const schema = websiteSchema();

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "WebSite");
  assert.ok(schema.name, "Should have a name");
  assert.ok(schema.url, "Should have a url");

  const action = schema.potentialAction as Record<string, unknown>;
  assert.equal(action["@type"], "SearchAction");

  const target = action.target as Record<string, unknown>;
  assert.equal(target["@type"], "EntryPoint");
  assert.ok(
    (target.urlTemplate as string).includes("{search_term_string}"),
    "SearchAction target should include search_term_string placeholder"
  );
});

test("productSchema returns valid JSON-LD for a basic product", () => {
  const product = {
    id: "prod-1",
    slug: "fresh-apples",
    name: "Fresh Apples",
    category: "Fruits",
    price: 120,
    image: "https://images.unsplash.com/photo-test?w=800",
    description: "Crisp and juicy apples",
    stock: 50,
    popularity: 95,
    unit: "kg",
  };

  const schema = productSchema(product);

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "Product");
  assert.equal(schema.name, "Fresh Apples");
  assert.equal(schema.description, "Crisp and juicy apples");

  const offers = schema.offers as Record<string, unknown>;
  assert.equal(offers["@type"], "Offer");
  assert.equal(offers.priceCurrency, "INR");
  assert.equal(offers.price, 120);
  assert.equal(offers.availability, "https://schema.org/InStock");
});

test("productSchema uses discountPrice when available", () => {
  const product = {
    id: "prod-2",
    slug: "organic-milk",
    name: "Organic Milk",
    category: "Dairy",
    price: 80,
    discountPrice: 65,
    image: "https://images.unsplash.com/photo-milk?w=800",
    description: "Fresh organic milk",
    stock: 20,
    popularity: 80,
    unit: "litre",
  };

  const schema = productSchema(product);
  const offers = schema.offers as Record<string, unknown>;
  assert.equal(offers.price, 65, "Should use discountPrice when available");
});

test("productSchema shows OutOfStock for zero stock", () => {
  const product = {
    id: "prod-3",
    slug: "sold-out-item",
    name: "Sold Out Item",
    category: "Snacks",
    price: 50,
    image: "",
    description: "Currently unavailable",
    stock: 0,
    popularity: 10,
    unit: "pack",
  };

  const schema = productSchema(product);
  const offers = schema.offers as Record<string, unknown>;
  assert.equal(offers.availability, "https://schema.org/OutOfStock");
});

test("productSchema includes aggregateRating when review data is present", () => {
  const product = {
    id: "prod-4",
    slug: "rated-product",
    name: "Rated Product",
    category: "Beverages",
    price: 30,
    image: "",
    description: "Well reviewed product",
    stock: 100,
    popularity: 90,
    unit: "bottle",
    avgRating: 4.5,
    reviewCount: 28,
  };

  const schema = productSchema(product);
  const rating = schema.aggregateRating as Record<string, unknown>;
  assert.equal(rating["@type"], "AggregateRating");
  assert.equal(rating.ratingValue, 4.5);
  assert.equal(rating.reviewCount, 28);
});

test("productSchema omits aggregateRating when no reviews", () => {
  const product = {
    id: "prod-5",
    slug: "no-reviews",
    name: "No Reviews Product",
    category: "Household",
    price: 200,
    image: "",
    description: "New product",
    stock: 5,
    popularity: 1,
    unit: "piece",
    avgRating: 0,
    reviewCount: 0,
  };

  const schema = productSchema(product);
  assert.equal(schema.aggregateRating, undefined, "Should not include aggregateRating with zero reviews");
});

test("offerCatalogSchema returns valid JSON-LD with offers list", () => {
  const offers = [
    { id: "o1", title: "10% off Fruits", description: "All fruits discounted", discountType: "PERCENTAGE", discountValue: 10 },
    { id: "o2", title: "Flat Rs.50 off", description: null, discountType: "FLAT", discountValue: 50 },
  ];

  const schema = offerCatalogSchema(offers);

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "OfferCatalog");
  assert.ok(schema.name, "Should have a catalog name");

  const items = schema.itemListElement as Record<string, unknown>[];
  assert.equal(items.length, 2);
  assert.equal(items[0]["@type"], "Offer");
  assert.equal(items[0].name, "10% off Fruits");
  assert.equal(items[0].discount, "10%");
  assert.equal(items[1].discount, "\u20B950");
});

test("offerCatalogSchema handles empty offers array", () => {
  const schema = offerCatalogSchema([]);

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "OfferCatalog");
  const items = schema.itemListElement as Record<string, unknown>[];
  assert.equal(items.length, 0);
});

test("breadcrumbSchema returns valid BreadcrumbList JSON-LD", () => {
  const items = [
    { name: "Home", url: "https://msmsupermarket.in" },
    { name: "Products", url: "https://msmsupermarket.in/products" },
    { name: "Fresh Apples", url: "https://msmsupermarket.in/products/fresh-apples" },
  ];

  const schema = breadcrumbSchema(items);

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "BreadcrumbList");

  const elements = schema.itemListElement as Record<string, unknown>[];
  assert.equal(elements.length, 3);
  assert.equal(elements[0].position, 1);
  assert.equal(elements[0].name, "Home");
  assert.equal(elements[0].item, "https://msmsupermarket.in");
  assert.equal(elements[2].position, 3);
  assert.equal(elements[2].name, "Fresh Apples");
});

test("breadcrumbSchema handles single item breadcrumb", () => {
  const items = [{ name: "Home", url: "https://msmsupermarket.in" }];

  const schema = breadcrumbSchema(items);
  const elements = schema.itemListElement as Record<string, unknown>[];
  assert.equal(elements.length, 1);
  assert.equal(elements[0].position, 1);
});
