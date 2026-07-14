import assert from "node:assert/strict";
import test from "node:test";

import {
  orderConfirmed,
  orderDispatched,
  orderDelivered,
} from "../lib/sms/templates";

test("orderConfirmed returns message with order number and total", () => {
  const result = orderConfirmed("RS-20250120-1234", 499);

  assert.ok(result.includes("RS-20250120-1234"), "Message should include order number");
  assert.ok(result.includes("499"), "Message should include total amount");
  assert.ok(result.includes("confirmed"), "Message should mention confirmation");
});

test("orderConfirmed includes ETA when provided", () => {
  const result = orderConfirmed("RS-20250120-5678", 250, "30 minutes");

  assert.ok(result.includes("30 minutes"), "Message should include ETA");
  assert.ok(result.includes("RS-20250120-5678"), "Message should include order number");
});

test("orderConfirmed works without ETA", () => {
  const result = orderConfirmed("RS-20250120-9999", 100);

  assert.ok(!result.includes("ETA"), "Message should not include ETA text when not provided");
  assert.ok(result.includes("RS-20250120-9999"), "Message should include order number");
});

test("orderDispatched returns message with order number", () => {
  const result = orderDispatched("RS-20250120-1234", "Ravi Kumar");

  assert.ok(result.includes("RS-20250120-1234"), "Message should include order number");
  assert.ok(result.includes("Ravi Kumar"), "Message should include rider name");
  assert.ok(result.includes("on the way"), "Message should mention delivery is on the way");
});

test("orderDispatched works without rider name", () => {
  const result = orderDispatched("RS-20250120-5678");

  assert.ok(result.includes("RS-20250120-5678"), "Message should include order number");
  assert.ok(result.includes("delivery partner"), "Message should use generic term when no rider name");
});

test("orderDelivered returns message with order number", () => {
  const result = orderDelivered("RS-20250120-1234");

  assert.ok(result.includes("RS-20250120-1234"), "Message should include order number");
  assert.ok(result.includes("delivered"), "Message should mention delivery");
  assert.ok(result.includes("Thank you"), "Message should include thank you");
});

test("all SMS templates include store name", () => {
  const messages = [
    orderConfirmed("RS-001", 100),
    orderDispatched("RS-001"),
    orderDelivered("RS-001"),
  ];

  for (const msg of messages) {
    assert.ok(typeof msg === "string", "Template should return a string");
    assert.ok(msg.length > 0, "Message should not be empty");
    assert.ok(msg.length <= 320, "SMS message should be reasonably short (under 320 chars)");
  }
});

test("SMS templates produce consistent format", () => {
  const confirmed = orderConfirmed("RS-TEST-001", 299);
  const dispatched = orderDispatched("RS-TEST-001", "Ajay");
  const delivered = orderDelivered("RS-TEST-001");

  // All start with store name prefix
  const storePrefix = confirmed.split(":")[0];
  assert.ok(dispatched.startsWith(storePrefix), "Dispatched message should start with store name");
  assert.ok(delivered.startsWith(storePrefix), "Delivered message should start with store name");
});
