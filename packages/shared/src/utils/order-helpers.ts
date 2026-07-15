import type { OrderStatus } from "../types";

// ============================================
// Delivery ETA Visibility
// ============================================

/**
 * Returns true only when the order is in a dispatch status where
 * the delivery time estimate should be visible to the customer.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
const DISPATCH_STATUSES: OrderStatus[] = ["OUT_FOR_DELIVERY", "ARRIVING"];

export function isDeliveryEtaVisible(status: OrderStatus): boolean {
  return DISPATCH_STATUSES.includes(status);
}

// ============================================
// Status Revert Control
// ============================================

/**
 * Returns true if the given order status can be reverted to a previous state.
 * ORDER_RECEIVED has no previous state; DELIVERED and CANCELLED are terminal.
 *
 * Validates: Requirements 11.1, 11.2
 */
const NON_REVERTIBLE_STATUSES: OrderStatus[] = [
  "ORDER_RECEIVED",
  "DELIVERED",
  "CANCELLED",
];

export function canRevertStatus(status: OrderStatus): boolean {
  return !NON_REVERTIBLE_STATUSES.includes(status);
}

// ============================================
// Billed Badge Visibility
// ============================================

/**
 * Returns true if the "Billed" badge should be shown on the order card.
 * Requires a non-null billNumber AND status at PACKING or later in the
 * delivery pipeline.
 *
 * Validates: Requirements 9.1, 9.2
 */
const BILLED_ELIGIBLE_STATUSES: OrderStatus[] = [
  "PACKING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "ARRIVING",
  "DELIVERED",
];

export function shouldShowBilledBadge(order: {
  billNumber?: string | null;
  status: OrderStatus;
}): boolean {
  return order.billNumber !== null && order.billNumber !== undefined && BILLED_ELIGIBLE_STATUSES.includes(order.status);
}

// ============================================
// Packing Badge Visibility
// ============================================

/**
 * Returns true if the "Packing" badge should be shown on the order card.
 *
 * Validates: Requirements 9.2
 */
export function shouldShowPackingBadge(order: { status: OrderStatus }): boolean {
  return order.status === "PACKING";
}

// ============================================
// Quantity + Unit Formatting
// ============================================

/**
 * Formats a quantity and unit into a display string like "2 kg" or "3 pcs".
 *
 * Validates: Requirements 6.1, 6.2
 */
export function formatQuantityWithUnit(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}
