import assert from "node:assert/strict";
import test from "node:test";
import { hashRateLimitKey } from "../lib/distributed-rate-limit";

test("hashRateLimitKey produces a consistent SHA-256 hex string", () => {
  const hash = hashRateLimitKey("test-key");
  // SHA-256 hex output is always 64 characters
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("hashRateLimitKey returns the same hash for the same input", () => {
  const hash1 = hashRateLimitKey("consistent-input");
  const hash2 = hashRateLimitKey("consistent-input");
  assert.equal(hash1, hash2);
});

test("hashRateLimitKey produces different hashes for different inputs", () => {
  const hash1 = hashRateLimitKey("input-one");
  const hash2 = hashRateLimitKey("input-two");
  assert.notEqual(hash1, hash2);
});

test("hashRateLimitKey matches known SHA-256 output", () => {
  // Known SHA-256 of "hello" is 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
  const hash = hashRateLimitKey("hello");
  assert.equal(hash, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
});

test("hashRateLimitKey handles empty string", () => {
  const hash = hashRateLimitKey("");
  // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  assert.equal(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("hashRateLimitKey handles special characters", () => {
  const hash = hashRateLimitKey("user@example.com:192.168.1.1");
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
});
