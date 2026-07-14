import assert from "node:assert/strict";
import test from "node:test";

/**
 * Unit tests for analytics event definitions and PostHog wrapper behavior.
 *
 * These tests verify:
 * 1. Event type constants are defined correctly
 * 2. PostHog capture/identify/reset handle missing initialization gracefully
 * 3. The analytics abstraction layer fails silently when not configured
 */

// Import event constants and types (these are pure TypeScript, no runtime deps)
import { ANALYTICS_EVENTS } from "../lib/analytics/events.js";

// Import PostHog wrapper functions to test graceful degradation
import * as posthog from "../lib/analytics/posthog.js";

// Import analytics abstraction layer
import * as analytics from "../lib/analytics/index.js";

// --- Event constant tests ---

test("ANALYTICS_EVENTS contains all required event names", () => {
  assert.equal(ANALYTICS_EVENTS.PAGE_VIEW, "page_view");
  assert.equal(ANALYTICS_EVENTS.PRODUCT_VIEWED, "product_viewed");
  assert.equal(ANALYTICS_EVENTS.ADD_TO_CART, "add_to_cart");
  assert.equal(ANALYTICS_EVENTS.REMOVE_FROM_CART, "remove_from_cart");
  assert.equal(ANALYTICS_EVENTS.CHECKOUT_STARTED, "checkout_started");
  assert.equal(ANALYTICS_EVENTS.ORDER_PLACED, "order_placed");
  assert.equal(ANALYTICS_EVENTS.SEARCH_PERFORMED, "search_performed");
  assert.equal(ANALYTICS_EVENTS.OFFER_VIEWED, "offer_viewed");
  assert.equal(ANALYTICS_EVENTS.PROMO_CODE_APPLIED, "promo_code_applied");
});

test("ANALYTICS_EVENTS has exactly 9 events defined", () => {
  const eventCount = Object.keys(ANALYTICS_EVENTS).length;
  assert.equal(eventCount, 9);
});

test("ANALYTICS_EVENTS values are all unique strings", () => {
  const values = Object.values(ANALYTICS_EVENTS);
  const uniqueValues = new Set(values);
  assert.equal(values.length, uniqueValues.size);
  for (const v of values) {
    assert.equal(typeof v, "string");
    assert.ok(v.length > 0);
  }
});

test("ANALYTICS_EVENTS values follow snake_case convention", () => {
  for (const value of Object.values(ANALYTICS_EVENTS)) {
    assert.match(value, /^[a-z][a-z0-9_]*$/);
  }
});

// --- PostHog graceful degradation tests ---

test("posthog.capture does not throw when not initialized", () => {
  assert.doesNotThrow(() => {
    posthog.capture("test_event", { key: "value" });
  });
});

test("posthog.identify does not throw when not initialized", () => {
  assert.doesNotThrow(() => {
    posthog.identify("user_123", { name: "Test User" });
  });
});

test("posthog.reset does not throw when not initialized", () => {
  assert.doesNotThrow(() => {
    posthog.reset();
  });
});

test("posthog.isReady returns false when not initialized", () => {
  assert.equal(posthog.isReady(), false);
});

test("posthog.capture with no properties does not throw", () => {
  assert.doesNotThrow(() => {
    posthog.capture("bare_event");
  });
});

// --- Analytics abstraction layer tests ---

test("analytics.isAnalyticsConfigured returns false when env vars are not set", () => {
  // In test environment, NEXT_PUBLIC_POSTHOG_KEY is not set
  assert.equal(analytics.isAnalyticsConfigured(), false);
});

test("analytics.trackEvent does not throw when not configured", () => {
  assert.doesNotThrow(() => {
    analytics.trackEvent(ANALYTICS_EVENTS.PRODUCT_VIEWED, {
      productId: "prod_123",
      productName: "Test Product",
      category: "Groceries",
      price: 99,
    });
  });
});

test("analytics.identifyUser does not throw when not configured", () => {
  assert.doesNotThrow(() => {
    analytics.identifyUser("user_456", { email: "test@example.com" });
  });
});

test("analytics.resetUser does not throw when not configured", () => {
  assert.doesNotThrow(() => {
    analytics.resetUser();
  });
});

test("analytics.isAnalyticsReady returns false when not initialized", () => {
  assert.equal(analytics.isAnalyticsReady(), false);
});

test("analytics.initAnalytics resolves without error when env vars are missing", async () => {
  await assert.doesNotReject(async () => {
    await analytics.initAnalytics();
  });
});

test("analytics.trackEvent handles all event types without errors", () => {
  assert.doesNotThrow(() => {
    analytics.trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      url: "/products/milk",
      referrer: "/",
      title: "Fresh Milk",
    });
    analytics.trackEvent(ANALYTICS_EVENTS.ADD_TO_CART, {
      productId: "p1",
      productName: "Milk",
      quantity: 2,
      price: 50,
    });
    analytics.trackEvent(ANALYTICS_EVENTS.REMOVE_FROM_CART, {
      productId: "p1",
      productName: "Milk",
    });
    analytics.trackEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
      cartTotal: 500,
      itemCount: 5,
      paymentMethod: "cod",
    });
    analytics.trackEvent(ANALYTICS_EVENTS.ORDER_PLACED, {
      orderId: "ord_001",
      total: 500,
      itemCount: 5,
    });
    analytics.trackEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      query: "tomato",
      resultCount: 12,
    });
    analytics.trackEvent(ANALYTICS_EVENTS.OFFER_VIEWED, {
      offerId: "offer_1",
      offerTitle: "20% off",
    });
    analytics.trackEvent(ANALYTICS_EVENTS.PROMO_CODE_APPLIED, {
      code: "SAVE10",
      discount: 10,
      success: true,
    });
  });
});
