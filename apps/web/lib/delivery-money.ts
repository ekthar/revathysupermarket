export function toPaise(value: number) { return Math.round(value * 100); }

export function collectionBalance(input: { total: number; adjustment: number; wallet: number; cash: number; upi: number }) {
  const expectedPaise = Math.max(0, toPaise(input.total) - toPaise(input.adjustment) - toPaise(input.wallet));
  const collectedPaise = toPaise(input.cash) + toPaise(input.upi);
  const deltaPaise = collectedPaise - expectedPaise;
  const status = deltaPaise < 0 ? "SHORT" : deltaPaise > 0 ? "EXCESS" : input.upi > 0 ? "UPI_AWAITING_VERIFICATION" : "PENDING_HANDOVER";
  return { expected: expectedPaise / 100, collected: collectedPaise / 100, delta: deltaPaise / 100, balanced: deltaPaise === 0, status } as const;
}

export function validateDamageAdjustment(input: { orderTotal: number; itemUnitPrice: number; purchasedQuantity: number; previouslyAdjustedQuantity: number; quantity: number; previousReduction: number; reduction: number }) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0 || input.quantity + input.previouslyAdjustedQuantity > input.purchasedQuantity) return { valid: false, code: "QUANTITY_EXCEEDED" as const };
  if (input.reduction <= 0 || toPaise(input.reduction) > toPaise(input.itemUnitPrice * input.quantity)) return { valid: false, code: "ITEM_VALUE_EXCEEDED" as const };
  const orderCap = input.orderTotal * 0.2;
  return { valid: true, needsApproval: toPaise(input.previousReduction + input.reduction) > toPaise(orderCap), orderCap } as const;
}
