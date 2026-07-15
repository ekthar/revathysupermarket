import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isDeliveryEtaVisible,
  canRevertStatus,
  shouldShowBilledBadge,
  shouldShowPackingBadge,
  formatQuantityWithUnit,
} from "./order-helpers.ts";
import type { OrderStatus } from "../types/index.ts";

// ============================================
// isDeliveryEtaVisible
// ============================================

describe("isDeliveryEtaVisible", () => {
  it("returns true for OUT_FOR_DELIVERY", () => {
    assert.equal(isDeliveryEtaVisible("OUT_FOR_DELIVERY"), true);
  });

  it("returns true for ARRIVING", () => {
    assert.equal(isDeliveryEtaVisible("ARRIVING"), true);
  });

  it("returns false for ORDER_RECEIVED", () => {
    assert.equal(isDeliveryEtaVisible("ORDER_RECEIVED"), false);
  });

  it("returns false for ACCEPTED", () => {
    assert.equal(isDeliveryEtaVisible("ACCEPTED"), false);
  });

  it("returns false for PACKING", () => {
    assert.equal(isDeliveryEtaVisible("PACKING"), false);
  });

  it("returns false for READY_FOR_DELIVERY", () => {
    assert.equal(isDeliveryEtaVisible("READY_FOR_DELIVERY"), false);
  });

  it("returns false for DELIVERED", () => {
    assert.equal(isDeliveryEtaVisible("DELIVERED"), false);
  });

  it("returns false for CANCELLED", () => {
    assert.equal(isDeliveryEtaVisible("CANCELLED"), false);
  });

  it("returns false for AWAITING_CUSTOMER_APPROVAL", () => {
    assert.equal(isDeliveryEtaVisible("AWAITING_CUSTOMER_APPROVAL"), false);
  });

  it("returns false for CUSTOMER_UNAVAILABLE", () => {
    assert.equal(isDeliveryEtaVisible("CUSTOMER_UNAVAILABLE"), false);
  });

  it("returns false for RETURNED_TO_STORE", () => {
    assert.equal(isDeliveryEtaVisible("RETURNED_TO_STORE"), false);
  });
});

// ============================================
// canRevertStatus
// ============================================

describe("canRevertStatus", () => {
  it("returns false for ORDER_RECEIVED (initial state)", () => {
    assert.equal(canRevertStatus("ORDER_RECEIVED"), false);
  });

  it("returns false for DELIVERED (terminal state)", () => {
    assert.equal(canRevertStatus("DELIVERED"), false);
  });

  it("returns false for CANCELLED (terminal state)", () => {
    assert.equal(canRevertStatus("CANCELLED"), false);
  });

  it("returns true for ACCEPTED", () => {
    assert.equal(canRevertStatus("ACCEPTED"), true);
  });

  it("returns true for PACKING", () => {
    assert.equal(canRevertStatus("PACKING"), true);
  });

  it("returns true for READY_FOR_DELIVERY", () => {
    assert.equal(canRevertStatus("READY_FOR_DELIVERY"), true);
  });

  it("returns true for OUT_FOR_DELIVERY", () => {
    assert.equal(canRevertStatus("OUT_FOR_DELIVERY"), true);
  });

  it("returns true for ARRIVING", () => {
    assert.equal(canRevertStatus("ARRIVING"), true);
  });

  it("returns true for AWAITING_CUSTOMER_APPROVAL", () => {
    assert.equal(canRevertStatus("AWAITING_CUSTOMER_APPROVAL"), true);
  });

  it("returns true for CUSTOMER_UNAVAILABLE", () => {
    assert.equal(canRevertStatus("CUSTOMER_UNAVAILABLE"), true);
  });

  it("returns true for RETURNED_TO_STORE", () => {
    assert.equal(canRevertStatus("RETURNED_TO_STORE"), true);
  });
});

// ============================================
// shouldShowBilledBadge
// ============================================

describe("shouldShowBilledBadge", () => {
  it("returns true when billNumber is set and status is PACKING", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-001", status: "PACKING" }),
      true
    );
  });

  it("returns true when billNumber is set and status is READY_FOR_DELIVERY", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-002", status: "READY_FOR_DELIVERY" }),
      true
    );
  });

  it("returns true when billNumber is set and status is OUT_FOR_DELIVERY", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-003", status: "OUT_FOR_DELIVERY" }),
      true
    );
  });

  it("returns true when billNumber is set and status is ARRIVING", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-004", status: "ARRIVING" }),
      true
    );
  });

  it("returns true when billNumber is set and status is DELIVERED", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-005", status: "DELIVERED" }),
      true
    );
  });

  it("returns false when billNumber is null", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: null, status: "PACKING" }),
      false
    );
  });

  it("returns false when status is ORDER_RECEIVED even with billNumber", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-006", status: "ORDER_RECEIVED" }),
      false
    );
  });

  it("returns false when status is ACCEPTED even with billNumber", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-007", status: "ACCEPTED" }),
      false
    );
  });

  it("returns false when status is CANCELLED even with billNumber", () => {
    assert.equal(
      shouldShowBilledBadge({ billNumber: "BILL-008", status: "CANCELLED" }),
      false
    );
  });
});

// ============================================
// shouldShowPackingBadge
// ============================================

describe("shouldShowPackingBadge", () => {
  it("returns true when status is PACKING", () => {
    assert.equal(shouldShowPackingBadge({ status: "PACKING" }), true);
  });

  it("returns false when status is ORDER_RECEIVED", () => {
    assert.equal(shouldShowPackingBadge({ status: "ORDER_RECEIVED" }), false);
  });

  it("returns false when status is READY_FOR_DELIVERY", () => {
    assert.equal(shouldShowPackingBadge({ status: "READY_FOR_DELIVERY" }), false);
  });

  it("returns false when status is DELIVERED", () => {
    assert.equal(shouldShowPackingBadge({ status: "DELIVERED" }), false);
  });
});

// ============================================
// formatQuantityWithUnit
// ============================================

describe("formatQuantityWithUnit", () => {
  it('formats "2 kg" correctly', () => {
    assert.equal(formatQuantityWithUnit(2, "kg"), "2 kg");
  });

  it('formats "3 pcs" correctly', () => {
    assert.equal(formatQuantityWithUnit(3, "pcs"), "3 pcs");
  });

  it('formats "1 ltr" correctly', () => {
    assert.equal(formatQuantityWithUnit(1, "ltr"), "1 ltr");
  });

  it("handles decimal quantities", () => {
    assert.equal(formatQuantityWithUnit(0.5, "kg"), "0.5 kg");
  });

  it("handles large quantities", () => {
    assert.equal(formatQuantityWithUnit(100, "pcs"), "100 pcs");
  });
});
