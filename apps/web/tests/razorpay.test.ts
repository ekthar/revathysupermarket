import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "crypto";

/**
 * Unit tests for Razorpay payment signature verification logic.
 *
 * We test the HMAC-SHA256 signature generation/verification logic directly
 * without requiring the full module (which depends on env vars).
 */

// Replicate the signature verification logic from lib/payments/razorpay.ts
function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  keySecret: string;
}): boolean {
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = createHmac("sha256", params.keySecret)
    .update(body)
    .digest("hex");
  return expectedSignature === params.razorpaySignature;
}

function verifyWebhookSignature(params: {
  body: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expectedSignature = createHmac("sha256", params.webhookSecret)
    .update(params.body)
    .digest("hex");
  return expectedSignature === params.signature;
}

function generatePaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  keySecret: string
): string {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  return createHmac("sha256", keySecret).update(body).digest("hex");
}

function generateWebhookSignature(body: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret).update(body).digest("hex");
}

// --- Payment signature tests ---

test("verifyPaymentSignature returns true for valid signature", () => {
  const keySecret = "test_secret_key_12345";
  const razorpayOrderId = "order_abc123";
  const razorpayPaymentId = "pay_xyz789";
  const signature = generatePaymentSignature(razorpayOrderId, razorpayPaymentId, keySecret);

  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: signature,
    keySecret,
  });

  assert.equal(isValid, true);
});

test("verifyPaymentSignature returns false for invalid signature", () => {
  const keySecret = "test_secret_key_12345";
  const razorpayOrderId = "order_abc123";
  const razorpayPaymentId = "pay_xyz789";

  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: "invalid_signature_here",
    keySecret,
  });

  assert.equal(isValid, false);
});

test("verifyPaymentSignature returns false when order ID is tampered", () => {
  const keySecret = "test_secret_key_12345";
  const razorpayOrderId = "order_abc123";
  const razorpayPaymentId = "pay_xyz789";
  const signature = generatePaymentSignature(razorpayOrderId, razorpayPaymentId, keySecret);

  const isValid = verifyPaymentSignature({
    razorpayOrderId: "order_tampered",
    razorpayPaymentId,
    razorpaySignature: signature,
    keySecret,
  });

  assert.equal(isValid, false);
});

test("verifyPaymentSignature returns false when payment ID is tampered", () => {
  const keySecret = "test_secret_key_12345";
  const razorpayOrderId = "order_abc123";
  const razorpayPaymentId = "pay_xyz789";
  const signature = generatePaymentSignature(razorpayOrderId, razorpayPaymentId, keySecret);

  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId: "pay_tampered",
    razorpaySignature: signature,
    keySecret,
  });

  assert.equal(isValid, false);
});

test("verifyPaymentSignature returns false with wrong key secret", () => {
  const keySecret = "test_secret_key_12345";
  const wrongSecret = "wrong_secret_key_67890";
  const razorpayOrderId = "order_abc123";
  const razorpayPaymentId = "pay_xyz789";
  const signature = generatePaymentSignature(razorpayOrderId, razorpayPaymentId, keySecret);

  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: signature,
    keySecret: wrongSecret,
  });

  assert.equal(isValid, false);
});

test("verifyPaymentSignature produces consistent results", () => {
  const keySecret = "consistency_test_key";
  const razorpayOrderId = "order_consist_001";
  const razorpayPaymentId = "pay_consist_001";
  const signature = generatePaymentSignature(razorpayOrderId, razorpayPaymentId, keySecret);

  // Verify multiple times for consistency
  for (let i = 0; i < 5; i++) {
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: signature,
      keySecret,
    });
    assert.equal(isValid, true);
  }
});

// --- Webhook signature tests ---

test("verifyWebhookSignature returns true for valid webhook signature", () => {
  const webhookSecret = "webhook_secret_test";
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_123" } } } });
  const signature = generateWebhookSignature(body, webhookSecret);

  const isValid = verifyWebhookSignature({ body, signature, webhookSecret });
  assert.equal(isValid, true);
});

test("verifyWebhookSignature returns false for invalid webhook signature", () => {
  const webhookSecret = "webhook_secret_test";
  const body = JSON.stringify({ event: "payment.captured" });

  const isValid = verifyWebhookSignature({
    body,
    signature: "tampered_signature",
    webhookSecret,
  });

  assert.equal(isValid, false);
});

test("verifyWebhookSignature returns false when body is tampered", () => {
  const webhookSecret = "webhook_secret_test";
  const originalBody = JSON.stringify({ event: "payment.captured", amount: 1000 });
  const signature = generateWebhookSignature(originalBody, webhookSecret);

  const tamperedBody = JSON.stringify({ event: "payment.captured", amount: 9999 });
  const isValid = verifyWebhookSignature({ body: tamperedBody, signature, webhookSecret });

  assert.equal(isValid, false);
});

test("verifyWebhookSignature returns false with wrong webhook secret", () => {
  const webhookSecret = "correct_secret";
  const wrongSecret = "wrong_secret";
  const body = JSON.stringify({ event: "payment.failed" });
  const signature = generateWebhookSignature(body, webhookSecret);

  const isValid = verifyWebhookSignature({ body, signature, webhookSecret: wrongSecret });
  assert.equal(isValid, false);
});

test("payment signature format is hex string of 64 characters", () => {
  const keySecret = "format_test_key";
  const signature = generatePaymentSignature("order_fmt", "pay_fmt", keySecret);
  assert.equal(signature.length, 64);
  assert.match(signature, /^[a-f0-9]{64}$/);
});

test("webhook signature format is hex string of 64 characters", () => {
  const signature = generateWebhookSignature("test body", "test_secret");
  assert.equal(signature.length, 64);
  assert.match(signature, /^[a-f0-9]{64}$/);
});
