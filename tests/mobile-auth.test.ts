import test from "node:test";
import assert from "node:assert/strict";

// Set AUTH_SECRET for testing before importing the module
process.env.AUTH_SECRET = "test-secret-key-for-unit-tests";

import {
  generateAccessToken,
  verifyAccessToken,
  authenticateMobileRequest,
  generateRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
} from "../lib/mobile-auth";

test("generateAccessToken creates a valid JWT decodable by verifyAccessToken", () => {
  const token = generateAccessToken("user-123", "DELIVERY_PARTNER");
  const payload = verifyAccessToken(token);

  assert.ok(payload, "payload should not be null");
  assert.equal(payload.sub, "user-123");
  assert.equal(payload.role, "DELIVERY_PARTNER");
  assert.ok(payload.iat > 0);
  assert.ok(payload.exp > payload.iat);
  assert.equal(payload.exp - payload.iat, 900); // 15 minutes
});

test("verifyAccessToken rejects expired tokens", async () => {
  // Manually create a token that expired 1 second ago
  const jwt = await import("jsonwebtoken");
  const now = Math.floor(Date.now() / 1000);
  const expiredToken = jwt.default.sign(
    { sub: "user-expired", role: "CUSTOMER", iat: now - 1000, exp: now - 1 },
    process.env.AUTH_SECRET!
  );

  const payload = verifyAccessToken(expiredToken);
  assert.equal(payload, null, "expired token should return null");
});

test("verifyAccessToken rejects tokens with invalid signature", async () => {
  const jwt = await import("jsonwebtoken");
  const now = Math.floor(Date.now() / 1000);
  const badToken = jwt.default.sign(
    { sub: "user-bad", role: "CUSTOMER", iat: now, exp: now + 900 },
    "wrong-secret"
  );

  const payload = verifyAccessToken(badToken);
  assert.equal(payload, null, "invalid signature should return null");
});

test("authenticateMobileRequest extracts token from Authorization header", () => {
  const token = generateAccessToken("user-456", "STAFF");
  const request = new Request("http://localhost/api/test", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = authenticateMobileRequest(request);
  assert.ok(result, "result should not be null");
  assert.equal(result.userId, "user-456");
  assert.equal(result.role, "STAFF");
});

test("authenticateMobileRequest returns null for missing header", () => {
  const request = new Request("http://localhost/api/test");
  const result = authenticateMobileRequest(request);
  assert.equal(result, null);
});

test("authenticateMobileRequest returns null for invalid format", () => {
  const request = new Request("http://localhost/api/test", {
    headers: { Authorization: "Basic abc123" },
  });
  const result = authenticateMobileRequest(request);
  assert.equal(result, null);
});

test("hashRefreshToken produces hash that compareRefreshToken can verify", async () => {
  const refreshToken = generateRefreshToken();
  assert.ok(refreshToken.length > 0, "refresh token should be non-empty");

  const hash = await hashRefreshToken(refreshToken);
  assert.ok(hash.length > 0, "hash should be non-empty");
  assert.notEqual(hash, refreshToken, "hash should differ from raw token");

  const matches = await compareRefreshToken(refreshToken, hash);
  assert.equal(matches, true, "correct token should match hash");

  const wrongMatches = await compareRefreshToken("wrong-token", hash);
  assert.equal(wrongMatches, false, "wrong token should not match hash");
});

test("generateRefreshToken produces unique values", () => {
  const token1 = generateRefreshToken();
  const token2 = generateRefreshToken();
  assert.notEqual(token1, token2, "each call should produce a different token");
});
