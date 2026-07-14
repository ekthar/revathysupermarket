import { createHmac } from "crypto";

/**
 * Razorpay payment gateway utilities.
 *
 * Uses direct HTTPS calls to Razorpay API instead of an npm SDK.
 * Env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 */

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function getKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("RAZORPAY_KEY_ID is not configured");
  return keyId;
}

function getKeySecret(): string {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET is not configured");
  return keySecret;
}

function getWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  return secret;
}

/**
 * Creates a Razorpay order via their Orders API.
 * Amount is in paise (INR smallest unit).
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}> {
  const keyId = getKeyId();
  const keySecret = getKeySecret();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Razorpay order creation failed: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

/**
 * Verifies the payment signature returned by Razorpay Checkout.
 * The expected signature is HMAC-SHA256 of `razorpay_order_id|razorpay_payment_id`
 * using the key secret.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const keySecret = getKeySecret();
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");
  return expectedSignature === params.razorpaySignature;
}

/**
 * Verifies the webhook signature from Razorpay.
 * The expected signature is HMAC-SHA256 of the raw request body
 * using the webhook secret.
 */
export function verifyWebhookSignature(params: {
  body: string;
  signature: string;
}): boolean {
  const webhookSecret = getWebhookSecret();
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(params.body)
    .digest("hex");
  return expectedSignature === params.signature;
}

/**
 * Returns the Razorpay key ID for frontend use (safe to expose publicly).
 */
export function getRazorpayKeyId(): string {
  return getKeyId();
}
