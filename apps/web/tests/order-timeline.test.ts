import assert from "node:assert/strict";
import test from "node:test";
import {
  getTimelineStepIndex,
  getTimelineStatusLabel,
  TIMELINE_STEPS,
} from "../components/tracking/order-timeline";

// ─── TIMELINE_STEPS ───────────────────────────────────────────────────────────

test("TIMELINE_STEPS has exactly 7 steps", () => {
  assert.equal(TIMELINE_STEPS.length, 7);
});

test("TIMELINE_STEPS keys are in correct order", () => {
  const expected = [
    "ORDER_RECEIVED",
    "ACCEPTED",
    "PACKING",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "ARRIVING",
    "DELIVERED",
  ];
  assert.deepEqual(
    TIMELINE_STEPS.map((s) => s.key),
    expected
  );
});

// ─── getTimelineStepIndex ─────────────────────────────────────────────────────

test("getTimelineStepIndex returns 0 for ORDER_RECEIVED", () => {
  assert.equal(getTimelineStepIndex("ORDER_RECEIVED"), 0);
});

test("getTimelineStepIndex returns 0 for AWAITING_CUSTOMER_APPROVAL", () => {
  assert.equal(getTimelineStepIndex("AWAITING_CUSTOMER_APPROVAL"), 0);
});

test("getTimelineStepIndex returns 1 for ACCEPTED", () => {
  assert.equal(getTimelineStepIndex("ACCEPTED"), 1);
});

test("getTimelineStepIndex returns 2 for PACKING", () => {
  assert.equal(getTimelineStepIndex("PACKING"), 2);
});

test("getTimelineStepIndex returns 3 for READY_FOR_DELIVERY", () => {
  assert.equal(getTimelineStepIndex("READY_FOR_DELIVERY"), 3);
});

test("getTimelineStepIndex returns 4 for OUT_FOR_DELIVERY", () => {
  assert.equal(getTimelineStepIndex("OUT_FOR_DELIVERY"), 4);
});

test("getTimelineStepIndex returns 5 for ARRIVING", () => {
  assert.equal(getTimelineStepIndex("ARRIVING"), 5);
});

test("getTimelineStepIndex returns 6 for DELIVERED", () => {
  assert.equal(getTimelineStepIndex("DELIVERED"), 6);
});

test("getTimelineStepIndex returns 0 for unknown status", () => {
  assert.equal(getTimelineStepIndex("UNKNOWN_STATUS"), 0);
});

// ─── getTimelineStatusLabel ───────────────────────────────────────────────────

test("getTimelineStatusLabel returns correct label for ORDER_RECEIVED", () => {
  assert.equal(getTimelineStatusLabel("ORDER_RECEIVED"), "Order received");
});

test("getTimelineStatusLabel returns correct label for ACCEPTED", () => {
  assert.equal(getTimelineStatusLabel("ACCEPTED"), "Order accepted");
});

test("getTimelineStatusLabel returns correct label for PACKING", () => {
  assert.equal(getTimelineStatusLabel("PACKING"), "Packing your bag");
});

test("getTimelineStatusLabel returns correct label for READY_FOR_DELIVERY", () => {
  assert.equal(getTimelineStatusLabel("READY_FOR_DELIVERY"), "Ready for delivery");
});

test("getTimelineStatusLabel returns correct label for OUT_FOR_DELIVERY", () => {
  assert.equal(getTimelineStatusLabel("OUT_FOR_DELIVERY"), "Out for delivery");
});

test("getTimelineStatusLabel returns correct label for ARRIVING", () => {
  assert.equal(getTimelineStatusLabel("ARRIVING"), "Arriving soon");
});

test("getTimelineStatusLabel returns correct label for DELIVERED", () => {
  assert.equal(getTimelineStatusLabel("DELIVERED"), "Delivered");
});

test("getTimelineStatusLabel returns correct label for CANCELLED", () => {
  assert.equal(getTimelineStatusLabel("CANCELLED"), "Cancelled");
});

test("getTimelineStatusLabel returns raw status for unknown status", () => {
  assert.equal(getTimelineStatusLabel("SOME_UNKNOWN"), "SOME_UNKNOWN");
});

// ─── Step progression logic ───────────────────────────────────────────────────

test("Step indices are monotonically increasing through normal flow", () => {
  const flow = [
    "ORDER_RECEIVED",
    "ACCEPTED",
    "PACKING",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "ARRIVING",
    "DELIVERED",
  ];
  for (let i = 1; i < flow.length; i++) {
    assert.ok(
      getTimelineStepIndex(flow[i]) > getTimelineStepIndex(flow[i - 1]),
      `${flow[i]} (index ${getTimelineStepIndex(flow[i])}) should be > ${flow[i - 1]} (index ${getTimelineStepIndex(flow[i - 1])})`
    );
  }
});
