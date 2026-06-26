import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { safeCallbackUrl } from "../lib/safe-redirect";
import { verifyHmacSignature } from "../lib/security";
import { canManageOrders, canPackOrders } from "../lib/authz";
import { createDeliveryOtp } from "../lib/delivery";
import { generateOtp } from "../lib/otp";

test("safe callback accepts permitted internal paths", () => {
  assert.equal(safeCallbackUrl("/account/loyalty?from=menu", "/", ["/account"]), "/account/loyalty?from=menu");
});

test("safe callback rejects external and protocol-relative paths", () => {
  assert.equal(safeCallbackUrl("https://evil.example", "/", ["/"]), "/");
  assert.equal(safeCallbackUrl("//evil.example/path", "/", ["/"]), "/");
  assert.equal(safeCallbackUrl("/admin", "/dashboard", ["/dashboard", "/account"]), "/dashboard");
});

test("webhook HMAC must match the raw payload", () => {
  const payload = JSON.stringify({ entry: [] });
  const secret = "test-secret";
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  assert.equal(verifyHmacSignature(payload, signature, secret), true);
  assert.equal(verifyHmacSignature(`${payload}x`, signature, secret), false);
});

test("packing staff cannot perform manager-level order actions", () => {
  assert.equal(canPackOrders("PACKING_STAFF"), true);
  assert.equal(canManageOrders("PACKING_STAFF"), false);
  assert.equal(canManageOrders("MANAGER"), true);
});

test("customer OTP stays six digits", () => {
  assert.match(generateOtp(), /^\d{6}$/);
});

test("delivery OTP matches customer OTP length", () => {
  assert.match(createDeliveryOtp(), /^\d{6}$/);
});

test("production env verification requires Upstash rate limiting configuration", () => {
  const script = "scripts/verify-production-env.mjs";
  const failing = spawnSync(process.execPath, [script], {
    env: { ...process.env, NODE_ENV: "production", VERCEL_ENV: "", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" },
    encoding: "utf8"
  });
  assert.equal(failing.status, 1);
  assert.match(failing.stderr, /UPSTASH_REDIS_REST_URL/);
  assert.match(failing.stderr, /UPSTASH_REDIS_REST_TOKEN/);

  const passing = spawnSync(process.execPath, [script], {
    env: { ...process.env, NODE_ENV: "development", VERCEL_ENV: "", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" },
    encoding: "utf8"
  });
  assert.equal(passing.status, 0);
});
