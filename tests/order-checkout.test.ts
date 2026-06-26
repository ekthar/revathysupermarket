import assert from "node:assert/strict";
import test from "node:test";
import { checkoutErrorResponse } from "../lib/order-checkout";

test("checkoutErrorResponse returns 409 for PRODUCT_UNAVAILABLE", () => {
  const result = checkoutErrorResponse(new Error("PRODUCT_UNAVAILABLE"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "PRODUCT_UNAVAILABLE");
  assert.ok(result.error.includes("no longer available"));
});

test("checkoutErrorResponse returns 400 for MINIMUM_ORDER", () => {
  const result = checkoutErrorResponse(new Error("MINIMUM_ORDER"));
  assert.ok(result);
  assert.equal(result.status, 400);
  assert.equal(result.code, "MINIMUM_ORDER");
  assert.ok(result.error.includes("minimum order"));
});

test("checkoutErrorResponse returns 409 for OUT_OF_STOCK with product name", () => {
  const result = checkoutErrorResponse(new Error("OUT_OF_STOCK:Organic Milk"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "OUT_OF_STOCK");
  assert.ok(result.error.includes("Organic Milk"));
  assert.ok(result.error.includes("no longer available in the requested quantity"));
});

test("checkoutErrorResponse returns 409 for PROMO_INVALID", () => {
  const result = checkoutErrorResponse(new Error("PROMO_INVALID"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "PROMO_INVALID");
  assert.ok(result.error.includes("promo code"));
});

test("checkoutErrorResponse returns 409 for PROMO_EXHAUSTED", () => {
  const result = checkoutErrorResponse(new Error("PROMO_EXHAUSTED"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "PROMO_EXHAUSTED");
});

test("checkoutErrorResponse returns 409 for WALLET_BALANCE", () => {
  const result = checkoutErrorResponse(new Error("WALLET_BALANCE"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "WALLET_BALANCE");
  assert.ok(result.error.includes("wallet balance"));
});

test("checkoutErrorResponse returns 400 for DELIVERY_OUT_OF_RANGE", () => {
  const result = checkoutErrorResponse(new Error("DELIVERY_OUT_OF_RANGE"));
  assert.ok(result);
  assert.equal(result.status, 400);
  assert.equal(result.code, "DELIVERY_OUT_OF_RANGE");
  assert.ok(result.error.includes("delivery-fee range"));
});

test("checkoutErrorResponse returns 400 for DELIVERY_SLOT_REQUIRED", () => {
  const result = checkoutErrorResponse(new Error("DELIVERY_SLOT_REQUIRED"));
  assert.ok(result);
  assert.equal(result.status, 400);
  assert.equal(result.code, "DELIVERY_SLOT_REQUIRED");
});

test("checkoutErrorResponse returns 409 for DELIVERY_SLOT_FULL", () => {
  const result = checkoutErrorResponse(new Error("DELIVERY_SLOT_FULL"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "DELIVERY_SLOT_FULL");
});

test("checkoutErrorResponse returns 409 for LOYALTY_BALANCE", () => {
  const result = checkoutErrorResponse(new Error("LOYALTY_BALANCE"));
  assert.ok(result);
  assert.equal(result.status, 409);
  assert.equal(result.code, "LOYALTY_BALANCE");
});

test("checkoutErrorResponse returns null for unknown error", () => {
  const result = checkoutErrorResponse(new Error("SOME_UNKNOWN_ERROR"));
  assert.equal(result, null);
});

test("checkoutErrorResponse returns null for non-Error values", () => {
  const result = checkoutErrorResponse("random string");
  assert.equal(result, null);
});
