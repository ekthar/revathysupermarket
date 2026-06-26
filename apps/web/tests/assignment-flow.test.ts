import test from "node:test";
import assert from "node:assert/strict";

/**
 * Assignment flow tests - validates the full lifecycle of delivery assignment
 * events without requiring a database connection. Tests pure business logic
 * including creation, reassignment, acknowledgment, and reconciliation.
 */

interface AssignmentEvent {
  eventId: string;
  orderId: string;
  partnerId: string;
  orderNumber: string;
  assignedAt: Date;
  acknowledgedAt: Date | null;
  fcmSent: boolean;
  fcmSentAt: Date | null;
}

// Simulated in-memory store for testing
class AssignmentEventStore {
  private events: AssignmentEvent[] = [];

  createEvent(params: {
    orderId: string;
    partnerId: string;
    orderNumber: string;
  }): AssignmentEvent {
    const now = Date.now();
    const eventId = `assign-${params.orderId}-${params.partnerId}-${now}`;
    const event: AssignmentEvent = {
      eventId,
      orderId: params.orderId,
      partnerId: params.partnerId,
      orderNumber: params.orderNumber,
      assignedAt: new Date(now),
      acknowledgedAt: null,
      fcmSent: false,
      fcmSentAt: null,
    };
    this.events.push(event);
    return event;
  }

  findByEventId(eventId: string): AssignmentEvent | null {
    return this.events.find((e) => e.eventId === eventId) ?? null;
  }

  findPendingForPartner(partnerId: string): AssignmentEvent[] {
    return this.events.filter(
      (e) => e.partnerId === partnerId && e.acknowledgedAt === null
    );
  }

  acknowledge(eventId: string, requestingUserId: string): {
    success: boolean;
    error?: string;
    statusCode?: number;
    alreadyAcknowledged?: boolean;
  } {
    const event = this.findByEventId(eventId);
    if (!event) {
      return { success: false, error: "Event not found", statusCode: 404 };
    }
    if (event.partnerId !== requestingUserId) {
      return { success: false, error: "Forbidden", statusCode: 403 };
    }
    if (event.acknowledgedAt) {
      return { success: true, alreadyAcknowledged: true };
    }
    event.acknowledgedAt = new Date();
    return { success: true, alreadyAcknowledged: false };
  }

  markFcmSent(eventId: string): void {
    const event = this.findByEventId(eventId);
    if (event) {
      event.fcmSent = true;
      event.fcmSentAt = new Date();
    }
  }
}

test("assignment creates event with correct fields", () => {
  const store = new AssignmentEventStore();
  const event = store.createEvent({
    orderId: "order-1",
    partnerId: "partner-A",
    orderNumber: "ORD-001",
  });

  assert.ok(event.eventId.startsWith("assign-order-1-partner-A-"));
  assert.equal(event.orderId, "order-1");
  assert.equal(event.partnerId, "partner-A");
  assert.equal(event.orderNumber, "ORD-001");
  assert.ok(event.assignedAt instanceof Date);
  assert.equal(event.acknowledgedAt, null);
  assert.equal(event.fcmSent, false);
  assert.equal(event.fcmSentAt, null);
});

test("reassignment creates a new event (does not reuse old one)", () => {
  const store = new AssignmentEventStore();

  // First assignment to partner A
  const first = store.createEvent({
    orderId: "order-2",
    partnerId: "partner-A",
    orderNumber: "ORD-002",
  });

  // Reassignment to partner B (simulating admin reassignment)
  const second = store.createEvent({
    orderId: "order-2",
    partnerId: "partner-B",
    orderNumber: "ORD-002",
  });

  assert.notEqual(first.eventId, second.eventId);
  assert.equal(first.partnerId, "partner-A");
  assert.equal(second.partnerId, "partner-B");

  // Partner A still sees their unacknowledged event
  const pendingA = store.findPendingForPartner("partner-A");
  assert.equal(pendingA.length, 1);
  assert.equal(pendingA[0].eventId, first.eventId);

  // Partner B sees their new event
  const pendingB = store.findPendingForPartner("partner-B");
  assert.equal(pendingB.length, 1);
  assert.equal(pendingB[0].eventId, second.eventId);
});

test("unauthorized acknowledgment fails with 403", () => {
  const store = new AssignmentEventStore();
  const event = store.createEvent({
    orderId: "order-3",
    partnerId: "partner-A",
    orderNumber: "ORD-003",
  });

  // Partner B tries to acknowledge partner A's event
  const result = store.acknowledge(event.eventId, "partner-B");
  assert.equal(result.success, false);
  assert.equal(result.error, "Forbidden");
  assert.equal(result.statusCode, 403);

  // Event remains unacknowledged
  const pending = store.findPendingForPartner("partner-A");
  assert.equal(pending.length, 1);
});

test("duplicate acknowledgment succeeds (idempotent)", () => {
  const store = new AssignmentEventStore();
  const event = store.createEvent({
    orderId: "order-4",
    partnerId: "partner-C",
    orderNumber: "ORD-004",
  });

  // First acknowledgment
  const first = store.acknowledge(event.eventId, "partner-C");
  assert.equal(first.success, true);
  assert.equal(first.alreadyAcknowledged, false);

  // Second acknowledgment (idempotent)
  const second = store.acknowledge(event.eventId, "partner-C");
  assert.equal(second.success, true);
  assert.equal(second.alreadyAcknowledged, true);

  // Event is no longer pending
  const pending = store.findPendingForPartner("partner-C");
  assert.equal(pending.length, 0);
});

test("cold start reconciliation returns all pending events", () => {
  const store = new AssignmentEventStore();

  // Create several events for partner D
  store.createEvent({ orderId: "order-5", partnerId: "partner-D", orderNumber: "ORD-005" });
  store.createEvent({ orderId: "order-6", partnerId: "partner-D", orderNumber: "ORD-006" });
  store.createEvent({ orderId: "order-7", partnerId: "partner-D", orderNumber: "ORD-007" });

  // Acknowledge one of them
  const pending = store.findPendingForPartner("partner-D");
  assert.equal(pending.length, 3);

  store.acknowledge(pending[0].eventId, "partner-D");

  // After cold start, reconciliation returns only unacknowledged
  const afterReconcile = store.findPendingForPartner("partner-D");
  assert.equal(afterReconcile.length, 2);
});

test("acknowledging non-existent event returns 404", () => {
  const store = new AssignmentEventStore();
  const result = store.acknowledge("non-existent-id", "partner-A");
  assert.equal(result.success, false);
  assert.equal(result.error, "Event not found");
  assert.equal(result.statusCode, 404);
});

test("FCM sent flag can be marked after event creation", () => {
  const store = new AssignmentEventStore();
  const event = store.createEvent({
    orderId: "order-8",
    partnerId: "partner-E",
    orderNumber: "ORD-008",
  });

  assert.equal(event.fcmSent, false);
  store.markFcmSent(event.eventId);

  const updated = store.findByEventId(event.eventId);
  assert.ok(updated);
  assert.equal(updated.fcmSent, true);
  assert.ok(updated.fcmSentAt instanceof Date);
});

test("multiple assignments to same order create separate events", () => {
  const store = new AssignmentEventStore();

  // Admin assigns, then reassigns, then reassigns again
  const e1 = store.createEvent({ orderId: "order-9", partnerId: "partner-F", orderNumber: "ORD-009" });
  // Partner F acknowledges
  store.acknowledge(e1.eventId, "partner-F");

  // Reassign to partner G
  const e2 = store.createEvent({ orderId: "order-9", partnerId: "partner-G", orderNumber: "ORD-009" });

  // Reassign to partner H
  const e3 = store.createEvent({ orderId: "order-9", partnerId: "partner-H", orderNumber: "ORD-009" });

  // Each partner has correct pending state
  assert.equal(store.findPendingForPartner("partner-F").length, 0); // acknowledged
  assert.equal(store.findPendingForPartner("partner-G").length, 1);
  assert.equal(store.findPendingForPartner("partner-H").length, 1);

  // All events are distinct
  const ids = new Set([e1.eventId, e2.eventId, e3.eventId]);
  assert.equal(ids.size, 3);
});
