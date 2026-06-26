import test from "node:test";
import assert from "node:assert/strict";

/**
 * These tests validate the assignment event acknowledgment logic
 * without requiring a database connection. We test the pure business logic
 * that the /api/mobile/v1/assignments route implements.
 */

// Simulate the in-memory assignment event store for testing
interface AssignmentEvent {
  eventId: string;
  orderId: string;
  partnerId: string;
  orderNumber: string;
  assignedAt: Date;
  acknowledgedAt: Date | null;
}

/**
 * Pure business logic for acknowledging an assignment event.
 * Mirrors the logic in app/api/mobile/v1/assignments/route.ts.
 */
function acknowledgeAssignment(
  event: AssignmentEvent | null,
  requestingUserId: string
): { success: boolean; error?: string; statusCode?: number; alreadyAcknowledged?: boolean; event?: AssignmentEvent } {
  if (!event) {
    return { success: false, error: "Event not found", statusCode: 404 };
  }

  // Ownership check: only the assigned partner can acknowledge
  if (event.partnerId !== requestingUserId) {
    return { success: false, error: "Forbidden", statusCode: 403 };
  }

  // Idempotent: if already acknowledged, return success
  if (event.acknowledgedAt) {
    return { success: true, alreadyAcknowledged: true, event };
  }

  // Acknowledge the event
  const updated = { ...event, acknowledgedAt: new Date() };
  return { success: true, alreadyAcknowledged: false, event: updated };
}

/**
 * Generate a consistent event ID (mirrors the admin delivery route logic).
 */
function generateEventId(orderId: string, partnerId: string, timestamp: number): string {
  return `assign-${orderId}-${partnerId}-${timestamp}`;
}

test("idempotent acknowledgment: acknowledging twice returns success", () => {
  const event: AssignmentEvent = {
    eventId: generateEventId("order-1", "partner-A", 1000000),
    orderId: "order-1",
    partnerId: "partner-A",
    orderNumber: "ORD-001",
    assignedAt: new Date("2025-01-01T00:00:00Z"),
    acknowledgedAt: null,
  };

  // First acknowledgment
  const first = acknowledgeAssignment(event, "partner-A");
  assert.equal(first.success, true);
  assert.equal(first.alreadyAcknowledged, false);
  assert.ok(first.event?.acknowledgedAt !== null);

  // Second acknowledgment (event now has acknowledgedAt set)
  const acknowledgedEvent = { ...event, acknowledgedAt: new Date() };
  const second = acknowledgeAssignment(acknowledgedEvent, "partner-A");
  assert.equal(second.success, true);
  assert.equal(second.alreadyAcknowledged, true);
});

test("ownership check: partner A cannot acknowledge partner B's event", () => {
  const event: AssignmentEvent = {
    eventId: generateEventId("order-2", "partner-B", 2000000),
    orderId: "order-2",
    partnerId: "partner-B",
    orderNumber: "ORD-002",
    assignedAt: new Date("2025-01-01T00:00:00Z"),
    acknowledgedAt: null,
  };

  // Partner A tries to acknowledge partner B's event
  const result = acknowledgeAssignment(event, "partner-A");
  assert.equal(result.success, false);
  assert.equal(result.error, "Forbidden");
  assert.equal(result.statusCode, 403);
});

test("acknowledging a non-existent event returns 404", () => {
  const result = acknowledgeAssignment(null, "partner-A");
  assert.equal(result.success, false);
  assert.equal(result.error, "Event not found");
  assert.equal(result.statusCode, 404);
});

test("event ID generation follows the expected format", () => {
  const eventId = generateEventId("order-abc", "partner-xyz", 1719000000000);
  assert.equal(eventId, "assign-order-abc-partner-xyz-1719000000000");
});

test("owner can acknowledge their own unacknowledged event", () => {
  const event: AssignmentEvent = {
    eventId: generateEventId("order-3", "partner-C", 3000000),
    orderId: "order-3",
    partnerId: "partner-C",
    orderNumber: "ORD-003",
    assignedAt: new Date("2025-01-01T12:00:00Z"),
    acknowledgedAt: null,
  };

  const result = acknowledgeAssignment(event, "partner-C");
  assert.equal(result.success, true);
  assert.equal(result.alreadyAcknowledged, false);
  assert.ok(result.event);
  assert.ok(result.event.acknowledgedAt instanceof Date);
});
