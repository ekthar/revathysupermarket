import assert from "node:assert/strict";
import test from "node:test";

/**
 * Unit tests for email template functions.
 * Tests that template functions produce valid HTML with expected content.
 */

// Import templates directly - they only depend on SITE constants
import {
  orderConfirmation,
  orderDispatched,
  orderDelivered,
  passwordReset,
} from "../lib/email/templates";

test("orderConfirmation template returns subject and html", () => {
  const result = orderConfirmation({
    orderNumber: "RS-20250120-1234",
    customerName: "John Doe",
    items: [
      { name: "Milk 1L", quantity: 2, price: 60 },
      { name: "Bread", quantity: 1, price: 45 },
    ],
    total: 165,
    deliveryAddress: "123 Main St, Kerala",
    eta: "30 minutes",
  });

  assert.ok(result.subject.includes("RS-20250120-1234"), "Subject should include order number");
  assert.ok(result.subject.includes("Order Confirmed"), "Subject should include 'Order Confirmed'");
  assert.ok(result.html.includes("<!DOCTYPE html>"), "HTML should be a full document");
  assert.ok(result.html.includes("John Doe"), "HTML should include customer name");
  assert.ok(result.html.includes("RS-20250120-1234"), "HTML should include order number");
  assert.ok(result.html.includes("Milk 1L"), "HTML should include item names");
  assert.ok(result.html.includes("Bread"), "HTML should include all items");
  assert.ok(result.html.includes("165.00"), "HTML should include total");
  assert.ok(result.html.includes("123 Main St, Kerala"), "HTML should include delivery address");
  assert.ok(result.html.includes("30 minutes"), "HTML should include ETA");
});

test("orderConfirmation template works without ETA", () => {
  const result = orderConfirmation({
    orderNumber: "RS-20250120-5678",
    customerName: "Jane",
    items: [{ name: "Rice 5kg", quantity: 1, price: 350 }],
    total: 350,
    deliveryAddress: "456 Oak Ave",
  });

  assert.ok(result.html.includes("Jane"), "HTML should include customer name");
  assert.ok(!result.html.includes("Estimated Delivery"), "HTML should not include ETA section when not provided");
});

test("orderDispatched template returns subject and html with rider info", () => {
  const result = orderDispatched({
    orderNumber: "RS-20250120-1234",
    customerName: "John Doe",
    riderName: "Ravi Kumar",
    trackingLink: "https://example.com/track/123",
  });

  assert.ok(result.subject.includes("Dispatched"), "Subject should include 'Dispatched'");
  assert.ok(result.subject.includes("RS-20250120-1234"), "Subject should include order number");
  assert.ok(result.html.includes("<!DOCTYPE html>"), "HTML should be a full document");
  assert.ok(result.html.includes("John Doe"), "HTML should include customer name");
  assert.ok(result.html.includes("Ravi Kumar"), "HTML should include rider name");
  assert.ok(result.html.includes("https://example.com/track/123"), "HTML should include tracking link");
  assert.ok(result.html.includes("Track Your Order"), "HTML should include tracking button text");
});

test("orderDispatched template works without tracking link", () => {
  const result = orderDispatched({
    orderNumber: "RS-20250120-5678",
    customerName: "Jane",
    riderName: "Ajay",
  });

  assert.ok(result.html.includes("Ajay"), "HTML should include rider name");
  assert.ok(!result.html.includes("Track Your Order"), "HTML should not include tracking button when no link");
});

test("orderDelivered template returns subject and html with thank you message", () => {
  const result = orderDelivered({
    orderNumber: "RS-20250120-1234",
    customerName: "John Doe",
  });

  assert.ok(result.subject.includes("Delivered"), "Subject should include 'Delivered'");
  assert.ok(result.subject.includes("RS-20250120-1234"), "Subject should include order number");
  assert.ok(result.html.includes("<!DOCTYPE html>"), "HTML should be a full document");
  assert.ok(result.html.includes("John Doe"), "HTML should include customer name");
  assert.ok(result.html.includes("RS-20250120-1234"), "HTML should include order number");
  assert.ok(result.html.includes("Rate Your Experience"), "HTML should include review prompt");
  assert.ok(result.html.includes("delivered successfully"), "HTML should include delivery confirmation");
});

test("passwordReset template with OTP returns subject and html", () => {
  const result = passwordReset({
    name: "John",
    otp: "482916",
  });

  assert.ok(result.subject.includes("Password Reset"), "Subject should include 'Password Reset'");
  assert.ok(result.html.includes("<!DOCTYPE html>"), "HTML should be a full document");
  assert.ok(result.html.includes("John"), "HTML should include user name");
  assert.ok(result.html.includes("482916"), "HTML should include OTP");
  assert.ok(result.html.includes("valid for 10 minutes"), "HTML should include OTP expiry info");
  assert.ok(!result.html.includes("Reset Password"), "HTML should not include reset link button when OTP is used");
});

test("passwordReset template with reset link returns subject and html", () => {
  const result = passwordReset({
    name: "Jane",
    resetLink: "https://example.com/reset?token=abc123",
  });

  assert.ok(result.html.includes("Jane"), "HTML should include user name");
  assert.ok(result.html.includes("https://example.com/reset?token=abc123"), "HTML should include reset link");
  assert.ok(result.html.includes("Reset Password"), "HTML should include reset button text");
  assert.ok(result.html.includes("expire in 1 hour"), "HTML should include link expiry info");
});

test("passwordReset template works without name", () => {
  const result = passwordReset({
    otp: "123456",
  });

  assert.ok(result.html.includes("Hi,"), "HTML should use generic greeting when no name");
  assert.ok(result.html.includes("123456"), "HTML should include OTP");
});

test("all templates include proper HTML structure", () => {
  const templates = [
    orderConfirmation({
      orderNumber: "RS-001",
      customerName: "Test",
      items: [{ name: "Item", quantity: 1, price: 10 }],
      total: 10,
      deliveryAddress: "Address",
    }),
    orderDispatched({
      orderNumber: "RS-001",
      customerName: "Test",
      riderName: "Rider",
    }),
    orderDelivered({
      orderNumber: "RS-001",
      customerName: "Test",
    }),
    passwordReset({ otp: "000000" }),
  ];

  for (const template of templates) {
    assert.ok(template.subject.length > 0, "Subject should not be empty");
    assert.ok(template.html.includes("<!DOCTYPE html>"), "Should include DOCTYPE");
    assert.ok(template.html.includes("<html"), "Should include html tag");
    assert.ok(template.html.includes("</html>"), "Should close html tag");
    assert.ok(template.html.includes("<body"), "Should include body tag");
    assert.ok(template.html.includes("</body>"), "Should close body tag");
  }
});
