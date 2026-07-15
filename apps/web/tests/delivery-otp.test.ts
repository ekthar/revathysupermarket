import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { createDeliveryOtp, deliveryOtpExpiryDate, isDeliveryOtpActive, getActiveDeliveryOtp } from "../lib/delivery";

describe("createDeliveryOtp", () => {
  test("generates a 6-digit numeric string", () => {
    const otp = createDeliveryOtp();
    assert.match(otp, /^\d{6}$/);
  });

  test("generates different OTPs on successive calls", () => {
    const otps = new Set(Array.from({ length: 20 }, () => createDeliveryOtp()));
    // With 20 generations, we should have at least 2 unique values (high probability)
    assert.ok(otps.size > 1, "Expected multiple unique OTPs");
  });

  test("generates OTP in range 100000-999999", () => {
    for (let i = 0; i < 50; i++) {
      const otp = createDeliveryOtp();
      const num = Number(otp);
      assert.ok(num >= 100000 && num <= 999999, `OTP ${otp} out of range`);
    }
  });
});

describe("deliveryOtpExpiryDate", () => {
  test("returns a date in the future", () => {
    const expiry = deliveryOtpExpiryDate();
    assert.ok(expiry > new Date(), "Expiry should be in the future");
  });

  test("defaults to 30 minutes from now", () => {
    const before = Date.now();
    const expiry = deliveryOtpExpiryDate();
    const after = Date.now();
    const thirtyMin = 30 * 60 * 1000;
    assert.ok(expiry.getTime() >= before + thirtyMin - 100, "Expiry too early");
    assert.ok(expiry.getTime() <= after + thirtyMin + 100, "Expiry too late");
  });

  test("accepts custom minutes", () => {
    const before = Date.now();
    const expiry = deliveryOtpExpiryDate(60);
    const sixtyMin = 60 * 60 * 1000;
    assert.ok(expiry.getTime() >= before + sixtyMin - 100, "Custom expiry too early");
    assert.ok(expiry.getTime() <= before + sixtyMin + 200, "Custom expiry too late");
  });
});

describe("isDeliveryOtpActive", () => {
  test("returns false if OTP is null", () => {
    assert.equal(isDeliveryOtpActive(null, new Date(Date.now() + 60000)), false);
  });

  test("returns false if OTP is undefined", () => {
    assert.equal(isDeliveryOtpActive(undefined, new Date(Date.now() + 60000)), false);
  });

  test("returns true if OTP exists and expiry is in the future", () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);
    assert.equal(isDeliveryOtpActive("123456", futureDate), true);
  });

  test("returns false if OTP exists but expiry is in the past", () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000);
    assert.equal(isDeliveryOtpActive("123456", pastDate), false);
  });

  test("returns true if OTP exists with no expiry date (null)", () => {
    assert.equal(isDeliveryOtpActive("123456", null), true);
  });

  test("returns true if OTP exists with undefined expiry", () => {
    assert.equal(isDeliveryOtpActive("123456", undefined), true);
  });

  test("handles string date format for expiresAt", () => {
    const futureIso = new Date(Date.now() + 60000).toISOString();
    assert.equal(isDeliveryOtpActive("654321", futureIso), true);

    const pastIso = new Date(Date.now() - 60000).toISOString();
    assert.equal(isDeliveryOtpActive("654321", pastIso), false);
  });
});

describe("getActiveDeliveryOtp", () => {
  test("returns OTP when active", () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);
    assert.equal(getActiveDeliveryOtp("123456", futureDate), "123456");
  });

  test("returns null when OTP is expired", () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000);
    assert.equal(getActiveDeliveryOtp("123456", pastDate), null);
  });

  test("returns null when OTP is null", () => {
    assert.equal(getActiveDeliveryOtp(null, new Date(Date.now() + 60000)), null);
  });

  test("returns null when OTP is undefined", () => {
    assert.equal(getActiveDeliveryOtp(undefined, new Date(Date.now() + 60000)), null);
  });

  test("returns OTP when no expiry is set", () => {
    assert.equal(getActiveDeliveryOtp("999888", null), "999888");
  });

  test("returns null for empty string OTP", () => {
    assert.equal(getActiveDeliveryOtp("", new Date(Date.now() + 60000)), null);
  });
});
